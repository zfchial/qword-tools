import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
let active = false;

function webpToPng(input: string, output: string, timeout: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", ["-nostdin", "-hide_banner", "-v", "error", "-i", input, "-y", output], { stdio: ["ignore", "ignore", "pipe"], shell: false });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("FFMPEG_FAILED")); });
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 210 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 210 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload image files." }, { status: 400 }); }
  const files = form.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length || files.length > 20) return NextResponse.json({ error: "Select 1 to 20 images." }, { status: 400 });
  const raws: { bytes: Buffer; kind: "jpg" | "png" | "webp"; name: string }[] = [];
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: `"${file.name}" exceeds the 10 MB per-image limit.` }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    let kind: "jpg" | "png" | "webp" | "" = "";
    if (bytes.length > 3 && bytes.subarray(0, 3).toString("hex") === "ffd8ff") kind = "jpg";
    else if (bytes.length > 8 && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") kind = "png";
    else if (bytes.length > 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") kind = "webp";
    if (!kind) return NextResponse.json({ error: `"${file.name}" must be a valid JPEG, PNG, or WebP image.` }, { status: 415 });
    raws.push({ bytes, kind, name: file.name });
  }
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-imgpdf-"));
    const doc = await PDFDocument.create();
    for (const [index, raw] of raws.entries()) {
      let pngBytes: Buffer | undefined;
      if (raw.kind === "webp") {
        const src = path.join(dir, `${randomUUID()}.webp`);
        const dst = path.join(dir, `${randomUUID()}.png`);
        await writeFile(src, raw.bytes, { mode: 0o600, flag: "wx" });
        await webpToPng(src, dst, 30000);
        pngBytes = await readFile(dst);
      }
      const image = raw.kind === "jpg" ? await doc.embedJpg(raw.bytes) : await doc.embedPng(pngBytes ?? raw.bytes);
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const page = doc.addPage([image.width * scale, image.height * scale]);
      page.drawImage(image, { x: 0, y: 0, width: image.width * scale, height: image.height * scale });
      void index;
    }
    const data = Buffer.from(await doc.save());
    if (!data.length || data.length > 200 * 1024 * 1024) return NextResponse.json({ error: "Generated PDF exceeds the output size limit." }, { status: 422 });
    return new NextResponse(data, { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="qword-images.pdf"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "Could not build a PDF from these images." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
