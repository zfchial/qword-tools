import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 180;
const dir = path.join(process.cwd(), "data", "share");
const metaFile = path.join(dir, "meta.json");
type Meta = Record<string, { name: string; type: string; size: number; created: number }>;
const maxFile = 100 * 1024 * 1024;
const maxAge = 7 * 24 * 3600 * 1000;
async function loadMeta(): Promise<Meta> {
  try {
    return JSON.parse(await readFile(metaFile, "utf8"));
  } catch {
    return {};
  }
}
async function sweep(meta: Meta) {
  const now = Date.now();
  let dirty = false;
  for (const [id, m] of Object.entries(meta)) {
    if (now - m.created > maxAge) {
      await rm(path.join(dir, id), { force: true });
      delete meta[id];
      dirty = true;
    }
  }
  return dirty;
}
function safeName(raw: string) {
  const base = path.basename(raw || "file").replace(/[\r\n"\\]/g, "_").slice(0, 120);
  return base || "file";
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > 110 * 1024 * 1024) return NextResponse.json({ error: "Upload exceeds the 100 MB limit." }, { status: 413 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  const up = form.get("file");
  if (!(up instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (up.size < 1) return NextResponse.json({ error: "File is empty." }, { status: 400 });
  if (up.size > maxFile) return NextResponse.json({ error: "File limit is 100 MB." }, { status: 413 });
  await mkdir(dir, { recursive: true });
  const meta = await loadMeta();
  if (await sweep(meta)) {
    try {
      const files = await readdir(dir);
      void files;
    } catch {}
  }
  const id = randomBytes(6).toString("base64url");
  const bytes = Buffer.from(await up.arrayBuffer());
  if (bytes.length > maxFile) return NextResponse.json({ error: "File limit is 100 MB." }, { status: 413 });
  await writeFile(path.join(dir, id), bytes, { mode: 0o600, flag: "wx" });
  meta[id] = { name: safeName(up.name), type: up.type || "application/octet-stream", size: bytes.length, created: Date.now() };
  await writeFile(metaFile, JSON.stringify(meta), { mode: 0o600 });
  const st = await stat(path.join(dir, id)).catch(() => undefined);
  void st;
  return NextResponse.json({ id, name: meta[id].name, size: meta[id].size });
}
