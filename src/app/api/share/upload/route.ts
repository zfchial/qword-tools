import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 900;

const dir = path.join(process.cwd(), "data", "share");
const metaFile = path.join(dir, "meta.json");

type Meta = Record<string, { name: string; type: string; size: number; created: number }>;

const maxFile = 1024 * 1024 * 1024;
const maxAge = 7 * 24 * 3600 * 1000;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

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
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (f === "meta.json" || meta[f]) continue;
      const p = path.join(dir, f);
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

function safeName(raw: string) {
  const base = path.basename(raw || "file").replace(/[\r\n"\\]/g, "_").slice(0, 120);
  return base || "file";
}

async function saveUpload(request: NextRequest, id: string) {
  const contentType = request.headers.get("content-type") || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/);
  if (!boundaryMatch) throw new HttpError(400, "Choose a file to upload.");
  const boundary = (boundaryMatch[1] || boundaryMatch[2]).trim();
  if (!boundary) throw new HttpError(400, "Choose a file to upload.");
  const delimiter = Buffer.from("\r\n--" + boundary);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Choose a file to upload.");

  const filePath = path.join(dir, id);
  const out = createWriteStream(filePath, { mode: 0o600, flags: "wx" });
  let streamError: Error | null = null;
  out.on("error", (e) => {
    streamError = e;
  });

  let buf = Buffer.alloc(0);
  let headersDone = false;
  let fileName = "file";
  let fileType = "application/octet-stream";
  let size = 0;
  let finished = false;

  const fail = async (status: number, message: string): Promise<never> => {
    try {
      out.destroy();
    } catch {
    }
    await rm(filePath, { force: true }).catch(() => undefined);
    try {
      await reader.cancel();
    } catch {
    }
    throw new HttpError(status, message);
  };

  const writeChunk = async (chunk: Buffer): Promise<void> => {
    size += chunk.length;
    if (size > maxFile) await fail(413, "File limit is 1 GB.");
    if (streamError) await fail(500, "Upload failed. Please retry.");
    if (!out.write(chunk)) {
      await new Promise<void>((resolve, reject) => {
        out.once("drain", () => resolve());
        out.once("error", reject);
      });
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value && value.length) buf = Buffer.concat([buf, Buffer.from(value)]);
      if (!headersDone) {
        const end = buf.indexOf("\r\n\r\n");
        if (end === -1) {
          if (buf.length > 65536 || done) await fail(400, "Choose a file to upload.");
          continue;
        }
        const headerText = buf.subarray(0, end).toString("latin1");
        const fn = headerText.match(/filename="([^"]*)"/i)?.[1] ?? "";
        if (!fn) await fail(400, "Choose a file to upload.");
        fileName = safeName(fn);
        fileType = headerText.match(/content-type:\s*([^\r\n;]+)/i)?.[1]?.trim() || "application/octet-stream";
        headersDone = true;
        buf = buf.subarray(end + 4);
      }
      if (headersDone) {
        const idx = buf.indexOf(delimiter);
        if (idx !== -1) {
          if (idx > 0) await writeChunk(buf.subarray(0, idx));
          finished = true;
          break;
        }
        if (done) await fail(400, "Upload incomplete. Please retry.");
        if (buf.length > delimiter.length - 1) {
          const cut = buf.length - (delimiter.length - 1);
          await writeChunk(buf.subarray(0, cut));
          buf = buf.subarray(cut);
        }
      }
      if (done && !headersDone) await fail(400, "Choose a file to upload.");
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
  }

  if (!finished) {
    try {
      out.destroy();
    } catch {
    }
    await rm(filePath, { force: true }).catch(() => undefined);
    throw new HttpError(400, "Upload incomplete. Please retry.");
  }

  await new Promise<void>((resolve, reject) => {
    out.once("error", reject);
    out.end(() => resolve());
  });
  if (streamError) {
    await rm(filePath, { force: true }).catch(() => undefined);
    throw new HttpError(500, "Upload failed. Please retry.");
  }
  if (size < 1) {
    await rm(filePath, { force: true }).catch(() => undefined);
    throw new HttpError(400, "File is empty.");
  }
  return { name: fileName, type: fileType, size };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && origin !== `https://${host}` && origin !== `http://${host}`) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }
  const requestLength = Number(request.headers.get("content-length") || 0);
  if (requestLength > maxFile + 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Upload exceeds the 1 GB limit." }, { status: 413 });
  }
  await mkdir(dir, { recursive: true });
  const meta = await loadMeta();
  await sweep(meta);
  const id = randomBytes(6).toString("base64url");
  try {
    const saved = await saveUpload(request, id);
    meta[id] = { name: saved.name, type: saved.type, size: saved.size, created: Date.now() };
    await writeFile(metaFile, JSON.stringify(meta), { mode: 0o600 });
    return NextResponse.json({ id, name: saved.name, size: saved.size });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    await rm(path.join(dir, id), { force: true }).catch(() => undefined);
    return NextResponse.json({ error: "Upload failed. Please retry." }, { status: 500 });
  }
}
