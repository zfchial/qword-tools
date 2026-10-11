import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = false;
const maxInput = 50 * 1024 * 1024;

function run(args: string[], timeout: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("FFMPEG_FAILED")); });
  });
}

function detectAudio(bytes: Buffer) {
  if (bytes.subarray(0, 3).toString() === "ID3") return ".mp3";
  if (bytes.length > 1 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return ".mp3";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WAVE") return ".wav";
  if (bytes.subarray(0, 4).toString() === "OggS") return ".ogg";
  return "";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 60 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 60 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload an audio file." }, { status: 400 }); }
  const audio = form.get("audio");
  const start = Math.max(0, Number(form.get("start") || 0));
  const duration = Number(form.get("duration") || 0);
  if (!(audio instanceof File)) return NextResponse.json({ error: "Choose an audio file." }, { status: 400 });
  if (audio.size > maxInput) return NextResponse.json({ error: "Audio limit is 50 MB." }, { status: 413 });
  if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0 || duration > 3600) return NextResponse.json({ error: "Duration must be between 1 second and 1 hour." }, { status: 400 });
  const audioBytes = Buffer.from(await audio.arrayBuffer());
  const inExt = detectAudio(audioBytes);
  if (!inExt) return NextResponse.json({ error: "File must be a valid MP3, WAV, or OGG audio file." }, { status: 415 });
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-audiocut-"));
    const id = randomUUID();
    const input = path.join(dir, id + inExt);
    const output = path.join(dir, id + "-cut" + inExt);
    await writeFile(input, audioBytes, { mode: 0o600, flag: "wx" });
    await run(["-nostdin", "-hide_banner", "-v", "error", "-ss", String(start), "-i", input, "-t", String(duration), "-c", "copy", "-y", output], 90000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 200 * 1024 * 1024) return NextResponse.json({ error: "Output exceeds the size limit." }, { status: 422 });
    const data = await readFile(output);
    const mime = inExt === ".wav" ? "audio/wav" : inExt === ".mp3" ? "audio/mpeg" : "audio/ogg";
    const filename = path.basename(audio.name, path.extname(audio.name)).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "cut";
    return new NextResponse(data, { headers: { "Content-Type": mime, "Content-Disposition": `attachment; filename="${filename}-cut${inExt}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Cut timed out." : "Could not cut this audio file." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
