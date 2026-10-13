import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const tmpRoot = path.join(process.cwd(), "data", "share_tmp");
const MAX_CHUNK = 25 * 1024 * 1024;

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && origin !== `https://${host}` && origin !== `http://${host}`) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") || "";
  const index = Number(url.searchParams.get("index"));
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(uploadId) || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const metaPath = path.join(tmpRoot, uploadId, "meta.json");
  let meta: { totalChunks: number };
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8"));
  } catch {
    return NextResponse.json({ error: "Upload session expired. Restart upload." }, { status: 404 });
  }
  if (index >= meta.totalChunks) return NextResponse.json({ error: "Invalid chunk." }, { status: 400 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_CHUNK + 1024) {
    return NextResponse.json({ error: "Chunk too large." }, { status: 413 });
  }
  let buf: ArrayBuffer;
  try {
    buf = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Chunk read failed. Retry." }, { status: 400 });
  }
  if (buf.byteLength < 1 || buf.byteLength > MAX_CHUNK + 1024) {
    return NextResponse.json({ error: "Invalid chunk size." }, { status: 400 });
  }
  await writeFile(path.join(tmpRoot, uploadId, `chunk_${index}`), Buffer.from(buf), { mode: 0o600 });
  return NextResponse.json({ ok: true, index });
}
