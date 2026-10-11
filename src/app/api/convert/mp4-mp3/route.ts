import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 150;
let active = false;
const allowedBitrates = new Set(["128k", "192k", "256k", "320k"]);

function run(command: string, args: string[], timeout: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => { if (stdout.length < 65536) stdout += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { if (stderr.length < 65536) stderr += data.toString(); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve({ stdout, stderr }) : reject(new Error("INVALID_MEDIA")); });
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  if (request.headers.get("content-type")?.split(";")[0] !== "video/mp4") return NextResponse.json({ error: "Upload an MP4 file." }, { status: 415 });
  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length > 100 * 1024 * 1024) return NextResponse.json({ error: "The video exceeds the 100 MB limit." }, { status: 413 });
  if (buffer.length < 16) return NextResponse.json({ error: "Upload an MP4 file." }, { status: 400 });
  if (buffer.subarray(4, 8).toString("ascii") !== "ftyp") return NextResponse.json({ error: "The uploaded file is not a valid MP4 container." }, { status: 415 });

  active = true;
  const dir = await mkdtemp(path.join(os.tmpdir(), "qword-media-"));
  const input = path.join(dir, `${randomUUID()}.mp4`);
  const output = path.join(dir, `${randomUUID()}.mp3`);
  try {
    await writeFile(input, buffer, { mode: 0o600, flag: "wx" });
    const probe = await run("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", input], 15000);
    if (!probe.stdout.trim()) return NextResponse.json({ error: "No audio stream found in this MP4." }, { status: 422 });
    const bitrate = request.nextUrl.searchParams.get("bitrate") ?? "192k";
    await run("ffmpeg", ["-nostdin", "-v", "error", "-i", input, "-map", "0:a:0", "-vn", "-codec:a", "libmp3lame", "-b:a", allowedBitrates.has(bitrate) ? bitrate : "192k", "-f", "mp3", "-y", output], 120000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 200 * 1024 * 1024) return NextResponse.json({ error: "Generated audio exceeds the output size limit." }, { status: 422 });
    const { readFile } = await import("node:fs/promises");
    const data = await readFile(output);
    return new NextResponse(data, { headers: { "Content-Type": "audio/mpeg", "Content-Disposition": 'attachment; filename="qword-audio.mp3"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "Could not convert this MP4. Check that it contains a supported audio track." }, { status: 422 });
  } finally {
    await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
