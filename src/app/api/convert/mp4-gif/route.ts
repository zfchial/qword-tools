import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;
let active = false;

function run(args: string[], timeout: number) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"], shell: false });
    let stderr = "";
    child.stderr.on("data", (data: Buffer) => { if (stderr.length < 8192) stderr += data.toString(); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error("FFMPEG_FAILED")); });
  });
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  if (request.headers.get("content-type")?.split(";")[0] !== "video/mp4") return NextResponse.json({ error: "Upload an MP4 file." }, { status: 415 });
  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length > 100 * 1024 * 1024) return NextResponse.json({ error: "The video exceeds the 100 MB limit." }, { status: 413 });
  if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return NextResponse.json({ error: "The uploaded file is not a valid MP4 container." }, { status: 415 });
  const params = request.nextUrl.searchParams;
  const start = clampInt(params.get("start"), 0, 0, 3600);
  const duration = clampInt(params.get("duration"), 3, 1, 10);
  const width = clampInt(params.get("width"), 320, 160, 480);
  const fps = clampInt(params.get("fps"), 10, 5, 15);
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-gif-"));
    const id = randomUUID();
    const input = path.join(dir, id + ".mp4");
    const palette = path.join(dir, id + ".png");
    const output = path.join(dir, id + ".gif");
    await writeFile(input, buffer, { mode: 0o600, flag: "wx" });
    const vf = `fps=${fps},scale=${width}:-1:flags=lanczos`;
    await run(["-nostdin", "-hide_banner", "-v", "error", "-ss", String(start), "-t", String(duration), "-i", input, "-vf", vf + ",palettegen", "-y", palette], 60000);
    await run(["-nostdin", "-hide_banner", "-v", "error", "-ss", String(start), "-t", String(duration), "-i", input, "-i", palette, "-lavfi", vf + " [x]; [x][1:v] paletteuse", "-y", output], 60000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Generated GIF exceeds the 50 MB limit. Try a shorter clip." }, { status: 422 });
    const data = await readFile(output);
    return new NextResponse(data, { headers: { "Content-Type": "image/gif", "Content-Disposition": 'attachment; filename="qword-clip.gif"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "Could not create a GIF from this MP4." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
