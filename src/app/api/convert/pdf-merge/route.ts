import { PDFDocument } from "pdf-lib";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
let active = false;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 260 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 260 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload PDF files." }, { status: 400 }); }
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length < 2 || files.length > 10) return NextResponse.json({ error: "Select 2 to 10 PDF files." }, { status: 400 });
  const buffers: Buffer[] = [];
  for (const file of files) {
    if (!/\.pdf$/i.test(file.name)) return NextResponse.json({ error: `"${file.name}" is not a PDF file.` }, { status: 415 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: `"${file.name}" exceeds the 25 MB per-file limit.` }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: `"${file.name}" is not a valid PDF file.` }, { status: 415 });
    buffers.push(bytes);
  }
  active = true;
  try {
    const merged = await PDFDocument.create();
    for (const bytes of buffers) {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      if (doc.isEncrypted) return NextResponse.json({ error: "Encrypted PDFs are not supported." }, { status: 422 });
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      for (const page of pages) merged.addPage(page);
    }
    const data = Buffer.from(await merged.save());
    if (!data.length || data.length > 250 * 1024 * 1024) return NextResponse.json({ error: "Merged PDF exceeds the output size limit." }, { status: 422 });
    return new NextResponse(data, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="qword-merged.pdf"', "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not merge these PDFs. They may be damaged or encrypted." }, { status: 422 });
  } finally {
    active = false;
  }
}
