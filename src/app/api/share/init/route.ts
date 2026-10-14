import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const tmpRoot = path.join(process.cwd(), "data", "share_tmp");
const MAX_FILE = 1024 * 1024 * 1024;
const CHUNK_SIZE = 20 * 1024 * 1024;

type TmpMeta = { name: string; type: string; size: number; totalChunks: number; created: number };

async function sweep() {
  const now = Date.now();
  try {
    await mkdir(tmpRoot, { recursive: true });
    const dirs = await readdir(tmpRoot);
    for (const d of dirs) {
      const p = path.join(tmpRoot, d);
      const st = await stat(p).catch(() => undefined);
      if (!st) continue;
      if (st.isDirectory() && now - st.mtimeMs > 24 * 3600 * 1000) {
        await rm(p, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  } catch {
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && origin !== `https://${host}` && origin !== `http://${host}`) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
  let body: { name?: string; size?: number; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const size = Number(body.size || 0);
  if (!size || size < 1) return NextResponse.json({ error: "File is empty." }, { status: 400 });
  if (rateLimited(request, "share-init", 30, 3600 * 1000)) return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  if (size > MAX_FILE) return NextResponse.json({ error: "File limit is 1 GB." }, { status: 413 });
  const rawName = String(body.name || "file");
  const name = path.basename(rawName).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "file";
  const type = String(body.type || "application/octet-stream").slice(0, 120);
  await sweep();
  await mkdir(tmpRoot, { recursive: true });
  const uploadId = randomBytes(9).toString("base64url");
  const totalChunks = Math.ceil(size / CHUNK_SIZE);
  await mkdir(path.join(tmpRoot, uploadId), { recursive: true });
  const meta: TmpMeta = { name, type, size, totalChunks, created: Date.now() };
  await writeFile(path.join(tmpRoot, uploadId, "meta.json"), JSON.stringify(meta), { mode: 0o600 });
  return NextResponse.json({ uploadId, chunkSize: CHUNK_SIZE, totalChunks });
}
