import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = false;

function parseRanges(input: string, pages: number): number[][] {
  const out: number[][] = [];
  for (const part of input.split(",")) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid range "${t}". Use e.g. 1-3, 5.`);
    let a = Number(m[1]);
    let b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < 1 || a > pages || b > pages) throw new Error(`Pages 1-${pages} only (got "${t}").`);
    if (a > b) [a, b] = [b, a];
    const idx: number[] = [];
    for (let p = a; p <= b; p++) idx.push(p - 1);
    out.push(idx);
  }
  if (!out.length) throw new Error("Enter page ranges, e.g. 1-3, 5.");
  if (out.length > 20) throw new Error("At most 20 ranges per split.");
  return out;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  if (rateLimited(request, "pdf", 20, 60 * 1000)) return NextResponse.json({ error: "Too many conversions. Slow down." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 60 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 60 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 }); }
  const entry = form.get("file");
  const rangesRaw = String(form.get("ranges") || "");
  if (!(entry instanceof File) || entry.size < 1) return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
  if (!/\.pdf$/i.test(entry.name)) return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
  if (entry.size > 25 * 1024 * 1024) return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 413 });
  const bytes = Buffer.from(await entry.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "Not a valid PDF file." }, { status: 415 });
  active = true;
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    if (doc.isEncrypted) return NextResponse.json({ error: "Encrypted PDFs are not supported." }, { status: 422 });
    const pages = doc.getPageCount();
    let groups: number[][];
    try {
      groups = parseRanges(rangesRaw, pages);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    const zip = new JSZip();
    const base = entry.name.replace(/\.pdf$/i, "") || "split";
    let n = 0;
    for (const idx of groups) {
      n++;
      const part = await PDFDocument.create();
      const copied = await part.copyPages(doc, idx);
      for (const p of copied) part.addPage(p);
      zip.file(`${base}-part${n}.pdf`, Buffer.from(await part.save()));
    }
    const raw = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
    const data = new Blob([Uint8Array.from(raw)], { type: "application/zip" });
    const size = data.size;
    if (!size || size > 250 * 1024 * 1024) return NextResponse.json({ error: "Output exceeds the size limit." }, { status: 422 });
    return new NextResponse(data, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${base}-split.zip"`, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not split this PDF. It may be damaged or encrypted." }, { status: 422 });
  } finally {
    active = false;
  }
}
