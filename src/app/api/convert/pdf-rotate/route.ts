import { PDFDocument, degrees } from "pdf-lib";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = false;

function parsePages(input: string, pages: number): number[] {
  const t = input.trim().toLowerCase();
  if (t === "" || t === "all") return Array.from({ length: pages }, (_, i) => i);
  const out = new Set<number>();
  for (const part of t.split(",")) {
    const s = part.trim();
    if (!s) continue;
    const m = s.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid pages "${s}". Use e.g. 1-3, 5 or "all".`);
    let a = Number(m[1]);
    let b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < 1 || a > pages || b > pages) throw new Error(`Pages 1-${pages} only (got "${s}").`);
    if (a > b) [a, b] = [b, a];
    for (let p = a; p <= b; p++) out.add(p - 1);
  }
  if (!out.size) throw new Error('Enter pages like 1-3, 5 or "all".');
  return [...out].sort((x, y) => x - y);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 60 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 60 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 }); }
  const entry = form.get("file");
  const deg = Number(form.get("degrees"));
  if (!(entry instanceof File) || entry.size < 1) return NextResponse.json({ error: "Upload a PDF file." }, { status: 400 });
  if (!/\.pdf$/i.test(entry.name)) return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
  if (entry.size > 25 * 1024 * 1024) return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 413 });
  if (![90, 180, 270].includes(deg)) return NextResponse.json({ error: "Rotation must be 90, 180, or 270." }, { status: 400 });
  const bytes = Buffer.from(await entry.arrayBuffer());
  if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "Not a valid PDF file." }, { status: 415 });
  active = true;
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    if (doc.isEncrypted) return NextResponse.json({ error: "Encrypted PDFs are not supported." }, { status: 422 });
    let targets: number[];
    try {
      targets = parsePages(String(form.get("pages") || "all"), doc.getPageCount());
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    for (const i of targets) {
      const page = doc.getPage(i);
      page.setRotation(degrees((page.getRotation().angle + deg) % 360));
    }
    const data = Buffer.from(await doc.save());
    if (!data.length || data.length > 250 * 1024 * 1024) return NextResponse.json({ error: "Output exceeds the size limit." }, { status: 422 });
    const base = (entry.name.replace(/\.pdf$/i, "") || "rotated") + "-rotated.pdf";
    return new NextResponse(data, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}"`, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not rotate this PDF. It may be damaged or encrypted." }, { status: 422 });
  } finally {
    active = false;
  }
}
