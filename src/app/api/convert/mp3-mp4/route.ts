import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 150;
let active = false;
const maxInput = 100 * 1024 * 1024;

function run(args: string[], timeout: number) {
  return new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
    let stderr = "";
    child.stderr.on("data", (data: Buffer) => { if (stderr.length < 8192) stderr += data.toString(); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stderr }); });
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 118 * 1024 * 1024) return NextResponse.json({ error: "Audio and cover upload exceeds the 115 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload an MP3 file." }, { status: 400 }); }
  const audio = form.get("audio");
  const cover = form.get("cover");
  const size = form.get("size");
  if (!(audio instanceof File)) return NextResponse.json({ error: "Choose an MP3 file." }, { status: 400 });
  if (audio.size > maxInput || (cover instanceof File && cover.size > 15 * 1024 * 1024)) return NextResponse.json({ error: "Audio limit is 100 MB; cover image limit is 15 MB." }, { status: 413 });
  if (!/\.mp3$/i.test(audio.name)) return NextResponse.json({ error: "Select an MP3 file." }, { status: 415 });
  if (size !== "1280x720" && size !== "1920x1080") return NextResponse.json({ error: "Choose 720p or 1080p output." }, { status: 400 });
  const audioBytes = Buffer.from(await audio.arrayBuffer());
  const startsWithId3 = audioBytes.subarray(0, 3).toString() === "ID3";
  const hasFrameSync = audioBytes.length > 1 && audioBytes[0] === 0xff && (audioBytes[1] & 0xe0) === 0xe0;
  if (!startsWithId3 && !hasFrameSync) return NextResponse.json({ error: "File does not contain an MP3 signature." }, { status: 415 });
  let coverBytes: Buffer | undefined;
  let coverExt = "";
  if (cover instanceof File && cover.size) {
    coverBytes = Buffer.from(await cover.arrayBuffer());
    if (coverBytes.subarray(0, 3).toString("hex") === "ffd8ff") coverExt = ".jpg";
    else if (coverBytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") coverExt = ".png";
    else if (coverBytes.subarray(0, 4).toString() === "RIFF" && coverBytes.subarray(8, 12).toString() === "WEBP") coverExt = ".webp";
    else return NextResponse.json({ error: "Cover must be a valid JPEG, PNG, or WebP image." }, { status: 415 });
  }
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-mp3-video-"));
    const id = randomUUID();
    const input = path.join(dir, id + ".mp3");
    const coverPath = coverBytes ? path.join(dir, id + coverExt) : undefined;
    const output = path.join(dir, id + ".mp4");
    await writeFile(input, audioBytes, { mode: 0o600, flag: "wx" });
    if (coverBytes && coverPath) await writeFile(coverPath, coverBytes, { mode: 0o600, flag: "wx" });
    const [width, height] = size.split("x");
    const scale = coverPath ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=yuv420p` : "format=yuv420p";
    const args = ["-nostdin", "-hide_banner", "-v", "error"];
    if (coverPath) args.push("-loop", "1", "-i", coverPath);
    else args.push("-f", "lavfi", "-i", `color=c=0x17221d:s=${size}:r=1`);
    args.push("-i", input, "-map", "0:v:0", "-map", "1:a:0", "-vf", scale, "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "-y", output);
    const result = await run(args, 120000);
    if (result.code !== 0) return NextResponse.json({ error: "Could not create MP4 from this audio." }, { status: 422 });
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 300 * 1024 * 1024) return NextResponse.json({ error: "Generated video exceeds the 300 MB limit." }, { status: 422 });
    const data = await readFile(output);
    const filename = path.basename(audio.name, path.extname(audio.name)).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "converted";
    return new NextResponse(data, { headers: { "Content-Type": "video/mp4", "Content-Disposition": `attachment; filename="${filename}.mp4"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "MP3 to MP4 conversion failed." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
