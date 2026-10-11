import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const maxInput = 15 * 1024 * 1024;

function run(args: string[], timeout: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("FFMPEG_FAILED")); });
  });
}

function detectImage(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.length > 7 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return ".png";
  if (bytes.length > 11 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return ".webp";
  return "";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 20 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 20 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload an image." }, { status: 400 }); }
  const image = form.get("image");
  const size = Math.min(256, Math.max(16, Number(form.get("size") || 64)));
  if (!(image instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  if (image.size > maxInput) return NextResponse.json({ error: "Image limit is 15 MB." }, { status: 413 });
  const imageBytes = Buffer.from(await image.arrayBuffer());
  const inExt = detectImage(imageBytes);
  if (!inExt) return NextResponse.json({ error: "File must be a valid JPG, PNG, or WebP image." }, { status: 415 });
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-favicon-"));
    const id = randomUUID();
    const input = path.join(dir, id + inExt);
    const output = path.join(dir, id + ".ico");
    await writeFile(input, imageBytes, { mode: 0o600, flag: "wx" });
    await run(["-nostdin", "-hide_banner", "-v", "error", "-i", input, "-vf", `scale=${size}:${size}`, "-frames:v", "1", "-y", output], 45000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Output exceeds the size limit." }, { status: 422 });
    const data = await readFile(output);
    const filename = path.basename(image.name, path.extname(image.name)).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "favicon";
    return new NextResponse(data, { headers: { "Content-Type": "image/x-icon", "Content-Disposition": `attachment; filename="${filename}.ico"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "Could not create an ICO from this image." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}
