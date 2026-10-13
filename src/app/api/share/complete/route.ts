import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 900;

const tmpRoot = path.join(process.cwd(), "data", "share_tmp");
const dir = path.join(process.cwd(), "data", "share");
const metaFile = path.join(dir, "meta.json");
const MAX_AGE = 7 * 24 * 3600 * 1000;

type Meta = Record<string, { name: string; type: string; size: number; created: number }>;
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
      await rm(path.join(dir, id), { force: true });
      delete meta[id];
      dirty = true;
    }
  }
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f === "meta.json" || meta[f]) continue;
      const p = path.join(dir, f);
      const { stat } = await import("node:fs/promises");
      const st = await stat(p).catch(() => undefined);
      if (st && st.isFile() && now - st.mtimeMs > 3600 * 1000) {
        await rm(p, { force: true });
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
  let body: { uploadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const uploadId = body.uploadId || "";
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(uploadId)) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const tmpDir = path.join(tmpRoot, uploadId);
  let meta: TmpMeta;
  try {
    meta = JSON.parse(await readFile(path.join(tmpDir, "meta.json"), "utf8"));
  } catch {
    return NextResponse.json({ error: "Upload session expired. Restart upload." }, { status: 404 });
  }
  for (let i = 0; i < meta.totalChunks; i++) {
    try {
      await readFile(path.join(tmpDir, `chunk_${i}`)).then((b) => {
        if (b.length < 1) throw new Error("empty");
      });
    } catch {
      return NextResponse.json({ error: `Chunk ${i + 1}/${meta.totalChunks} missing. Retry upload.`, missing: i }, { status: 400 });
    }
  }
  await mkdir(dir, { recursive: true });
  const store = await loadMeta();
  await sweep(store);
  const id = randomBytes(6).toString("base64url");
  const dest = path.join(dir, id);
  const out = createWriteStream(dest, { mode: 0o600, flags: "wx" });
  let total = 0;
  try {
    for (let i = 0; i < meta.totalChunks; i++) {
      const src = createReadStream(path.join(tmpDir, `chunk_${i}`));
      src.on("data", (c: string | Buffer) => {
        total += Buffer.isBuffer(c) ? c.length : Buffer.byteLength(c);
      });
      await pipeline(src, out, { end: false });
    }
  } catch {
    try {
      out.destroy();
    } catch {
    }
    await rm(dest, { force: true }).catch(() => undefined);
    return NextResponse.json({ error: "Assemble failed. Retry." }, { status: 500 });
  }
  await new Promise<void>((resolve, reject) => {
    out.once("error", reject);
    out.end(() => resolve());
  }).catch(async (e) => {
    await rm(dest, { force: true }).catch(() => undefined);
    throw e;
  });
  if (total !== meta.size || total < 1) {
    await rm(dest, { force: true }).catch(() => undefined);
    return NextResponse.json({ error: "Size mismatch. Retry upload." }, { status: 400 });
  }
  store[id] = { name: meta.name, type: meta.type, size: total, created: Date.now() };
  await writeFile(metaFile, JSON.stringify(store), { mode: 0o600 });
  await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  return NextResponse.json({ id, name: meta.name, size: total });
}
