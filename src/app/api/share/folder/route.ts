import { createWriteStream, createReadStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 900;

const tmpRoot = path.join(process.cwd(), "data", "share_tmp");
const dir = path.join(process.cwd(), "data", "share");
const metaFile = path.join(dir, "meta.json");
const MAX_AGE = 7 * 24 * 3600 * 1000;
const MAX_FILES = 10;
const MAX_TOTAL = 1024 * 1024 * 1024;

type Meta = Record<string, { name?: string; type?: string; size: number; created: number; folder?: boolean; files?: { name: string; type: string; size: number }[] }>;
type TmpMeta = { name: string; type: string; size: number; totalChunks: number; created: number };

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
    if (now - m.created > MAX_AGE) {
      await rm(path.join(dir, id), { recursive: true, force: true });
      delete meta[id];
      dirty = true;
    }
  }
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f === "meta.json" || meta[f]) continue;
      const p = path.join(dir, f);
      const st = await stat(p).catch(() => undefined);
      if (st && now - st.mtimeMs > 3600 * 1000) {
        await rm(p, { recursive: true, force: true });
      }
    }
  } catch {
  }
  if (dirty) {
    await writeFile(metaFile, JSON.stringify(meta), { mode: 0o600 }).catch(() => undefined);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && origin !== `https://${host}` && origin !== `http://${host}`) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
  let body: { uploadIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const uploadIds = Array.isArray(body.uploadIds) ? body.uploadIds : [];
  if (uploadIds.length < 2 || uploadIds.length > MAX_FILES) {
    return NextResponse.json({ error: `Send 2-${MAX_FILES} uploaded files.` }, { status: 400 });
  }
  const seen = new Set<string>();
  for (const u of uploadIds) {
    if (typeof u !== "string" || !/^[A-Za-z0-9_-]{8,32}$/.test(u) || seen.has(u)) {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }
    seen.add(u);
  }
  // Verifikasi semua upload lengkap sebelum merakit apa pun.
  const metas: TmpMeta[] = [];
  let total = 0;
  for (const uploadId of uploadIds) {
    const tmpDir = path.join(tmpRoot, uploadId);
    let meta: TmpMeta;
    try {
      meta = JSON.parse(await readFile(path.join(tmpDir, "meta.json"), "utf8"));
    } catch {
      return NextResponse.json({ error: "An upload session expired. Restart upload." }, { status: 404 });
    }
    for (let i = 0; i < meta.totalChunks; i++) {
      try {
        const b = await readFile(path.join(tmpDir, `chunk_${i}`));
        if (b.length < 1) throw new Error("empty");
      } catch {
        return NextResponse.json({ error: `A file part is missing (${meta.name}). Retry upload.` }, { status: 400 });
      }
    }
    total += meta.size;
    metas.push(meta);
  }
  if (total < 1 || total > MAX_TOTAL) {
    return NextResponse.json({ error: "Total size must be 1 byte - 1 GB." }, { status: 413 });
  }
  await mkdir(dir, { recursive: true });
  const store = await loadMeta();
  await sweep(store);
  const id = randomBytes(6).toString("base64url");
  const destDir = path.join(dir, id);
  await mkdir(destDir, { recursive: true });
  const files: { name: string; type: string; size: number }[] = [];
  try {
    for (let n = 0; n < metas.length; n++) {
      const meta = metas[n];
      const tmpDir = path.join(tmpRoot, uploadIds[n]);
      const dest = path.join(destDir, String(n));
      const out = createWriteStream(dest, { mode: 0o600, flags: "wx" });
      let written = 0;
      try {
        for (let i = 0; i < meta.totalChunks; i++) {
          const src = createReadStream(path.join(tmpDir, `chunk_${i}`));
          src.on("data", (c: string | Buffer) => {
            written += Buffer.isBuffer(c) ? c.length : Buffer.byteLength(c);
          });
          await pipeline(src, out, { end: false });
        }
      } catch {
        try {
          out.destroy();
        } catch {
        }
        throw new Error("assemble");
      }
      await new Promise<void>((resolve, reject) => {
        out.once("error", reject);
        out.end(() => resolve());
      });
      if (written !== meta.size || written < 1) throw new Error("size");
      files.push({ name: meta.name, type: meta.type, size: written });
    }
  } catch {
    await rm(destDir, { recursive: true, force: true }).catch(() => undefined);
    return NextResponse.json({ error: "Assemble failed. Retry." }, { status: 500 });
  }
  store[id] = { folder: true, size: total, created: Date.now(), files };
  await writeFile(metaFile, JSON.stringify(store), { mode: 0o600 });
  for (const uploadId of uploadIds) {
    await rm(path.join(tmpRoot, uploadId), { recursive: true, force: true }).catch(() => undefined);
  }
  return NextResponse.json({ id, files, size: total });
}
