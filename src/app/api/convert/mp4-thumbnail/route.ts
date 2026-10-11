import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
let active = false;

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
  if (request.headers.get("content-type")?.split(";")[0] !== "video/mp4") return NextResponse.json({ error: "Upload an MP4 file." }, { status: 415 });
  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length > 100 * 1024 * 1024) return NextResponse.json({ error: "The video exceeds the 100 MB limit." }, { status: 413 });
  if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return NextResponse.json({ error: "The uploaded file is not a valid MP4 container." }, { status: 415 });
  const rawAt = Number(request.nextUrl.searchParams.get("at"));
  const at = Number.isFinite(rawAt) ? Math.min(3600, Math.max(0, rawAt)) : 1;
  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-thumb-"));
    const id = randomUUID();
    const input = path.join(dir, id + ".mp4");
    const output = path.join(dir, id + ".png");
    await writeFile(input, buffer, { mode: 0o600, flag: "wx" });
    await run(["-nostdin", "-hide_banner", "-v", "error", "-ss", String(at), "-i", input, "-frames:v", "1", "-y", output], 30000);
    const outputStat = await stat(output);
    if (!outputStat.size || outputStat.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Could not extract a thumbnail from this MP4." }, { status: 422 });
    const data = await readFile(output);
    return new NextResponse(data, { headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="qword-thumbnail.png"', "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "TIMEOUT" ? "Conversion timed out." : "Could not extract a thumbnail from this MP4." }, { status: 422 });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
