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
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
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
  if (requestLength > 120 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 120 MB request limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload an MP4 video." }, { status: 400 }); }
  const video = form.get("video");
  const start = Math.max(0, Number(form.get("start") || 0));
  const duration = Number(form.get("duration") || 0);
  if (!(video instanceof File)) return NextResponse.json({ error: "Choose an MP4 file." }, { status: 400 });
  if (video.size > maxInput) return NextResponse.json({ error: "Video limit is 100 MB." }, { status: 413 });
  if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0 || duration > 3600) return NextResponse.json({ error: "Duration must be between 1 second and 1 hour." }, { status: 400 });
  const videoBytes = Buffer.from(await video.arrayBuffer());
  if (videoBytes.subarray(4, 8).toString() !== "ftyp") return NextResponse.json({ error: "File must be a valid MP4 video." }, { status: 415 });
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-videotrim-"));
    const id = randomUUID();
    const input = path.join(dir, id + ".mp4");
    const output = path.join(dir, id + "-trimmed.mp4");
    await writeFile(input, videoBytes, { mode: 0o600, flag: "wx" });
    await run(["-nostdin", "-hide_banner", "-v", "error", "-ss", String(start), "-i", input, "-t", String(duration), "-c", "copy", "-movflags", "+faststart", "-y", output], 120000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 300 * 1024 * 1024) return NextResponse.json({ error: "Output exceeds the size limit." }, { status: 422 });
    const data = await readFile(output);
    const filename = path.basename(video.name, path.extname(video.name)).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "trimmed";
    return new NextResponse(data, { headers: { "Content-Type": "video/mp4", "Content-Disposition": `attachment; filename="${filename}-trimmed.mp4"`, "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Trim timed out." : "Could not trim this video." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
