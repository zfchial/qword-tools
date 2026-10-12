import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MAX_AGE = 7 * 24 * 3600 * 1000;

function esc(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

function shell(inner: string, title: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Qword Tools</title><style>:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5ef;color:#17221d;font-family:Arial,Helvetica,sans-serif;padding:24px}@media(prefers-color-scheme:dark){body{background:#101612;color:#e8eee9}}.card{max-width:520px;width:100%;background:#fff;border:1px solid #dce4dc;border-radius:16px;padding:36px 32px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.08)}@media(prefers-color-scheme:dark){.card{background:#1a211c;border-color:#344238}}.icon{font-size:52px;line-height:1;margin-bottom:12px}h1{font-size:24px;margin:0 0 10px}p{color:#4b5850;font-size:15px;line-height:1.7;margin:0 0 8px}@media(prefers-color-scheme:dark){p{color:#c2cdc4}}.btn{display:inline-block;margin-top:20px;background:#315f40;color:#fff!important;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none}@media(prefers-color-scheme:dark){.btn{background:#a3d9b1;color:#101612!important}}.small{font-size:13px;margin-top:14px}.mono{font-family:monospace;word-break:break-all}</style></head><body><div class="card">${inner}</div></body></html>`;
}

function htmlPage(inner: string, title: string, status: number) {
  return new Response(shell(inner, title), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(id)) {
    return htmlPage(
      `<div class="icon">🔍</div><h1>Link not found</h1><p>This download link doesn't exist. It may have been typed incorrectly, never uploaded, or already deleted.</p><a class="btn" href="/tool/file-share-link">Upload a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p>`,
      "Link not found",
      404,
    );
  }
  const dir = path.join(process.cwd(), "data", "share");
  const metaPath = path.join(dir, "meta.json");
  let meta: Record<string, { name: string; size: number; created: number }>;
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8"));
  } catch {
    return htmlPage(
      `<div class="icon">🔍</div><h1>File unavailable</h1><p>This file could not be found on the server. It may have expired or been deleted during cleanup.</p><p class="small mono">Link ID: ${esc(id)}</p><a class="btn" href="/tool/file-share-link">Upload a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p>`,
      "File unavailable",
      404,
    );
  }
  const m = meta[id];
  if (!m) {
    return htmlPage(
      `<div class="icon">🔍</div><h1>Link not found</h1><p>This file is no longer available. It may have expired (files are kept for 7 days) or been removed.</p><p class="small mono">Link ID: ${esc(id)}</p><a class="btn" href="/tool/file-share-link">Upload a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p>`,
      "Link not found",
      404,
    );
  }
  if (Date.now() - m.created > MAX_AGE) {
    const days = Math.floor((Date.now() - m.created) / (24 * 3600 * 1000));
    await rm(path.join(dir, id), { force: true }).catch(() => undefined);
    delete meta[id];
    await writeFile(metaPath, JSON.stringify(meta), { mode: 0o600 }).catch(() => undefined);
    return htmlPage(
      `<div class="icon">⏳</div><h1>This link has expired</h1><p>The file <strong>${esc(String(m.name || "file"))}</strong> was shared more than 7 days ago (${days} days) and has been deleted automatically.</p><p>Ask the sender to upload it again, or share a new file yourself — free up to 1 GB.</p><a class="btn" href="/tool/file-share-link">Share a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p>`,
      "Link expired",
      410,
    );
  }
  let data: Buffer;
  try {
    data = await readFile(path.join(dir, id));
  } catch {
    delete meta[id];
    await writeFile(metaPath, JSON.stringify(meta), { mode: 0o600 }).catch(() => undefined);
    return htmlPage(
      `<div class="icon">🔍</div><h1>File unavailable</h1><p>The file data is missing on the server even though the link record exists. It was likely removed during cleanup.</p><p class="small mono">Link ID: ${esc(id)}</p><a class="btn" href="/tool/file-share-link">Upload a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p>`,
      "File unavailable",
      404,
    );
  }
  const name = String(m.name || "file").replace(/[\r\n"\\]/g, "_");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
