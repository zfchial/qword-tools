import { readFile } from "node:fs/promises";
import path from "node:path";
import { SHARE_ID_RE, ShareEntry, safeMime, safeName, sendFile, shareRoot, shellPage } from "@/lib/share";

export const runtime = "nodejs";

export async function GET(request: Request, ctx: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await ctx.params;
  if (!SHARE_ID_RE.test(id)) return shellPage(`<div class="icon">🔍</div><h1>Link not found</h1>`, "Link not found", 404);
  const n = Number(file);
  if (!Number.isInteger(n) || n < 0 || n > 9) {
    return shellPage(`<div class="icon">🔍</div><h1>File not found</h1>`, "File not found", 404);
  }
  let meta: Record<string, ShareEntry>;
  try {
    meta = JSON.parse(await readFile(path.join(shareRoot(), "meta.json"), "utf8"));
  } catch {
    return shellPage(`<div class="icon">🔍</div><h1>File unavailable</h1>`, "File unavailable", 404);
  }
  const m = meta[id];
  if (!m || !m.folder || !Array.isArray(m.files) || !m.files[n]) {
    return shellPage(`<div class="icon">🔍</div><h1>File not found</h1><p class="meta">This file is no longer available or the link is invalid.</p>`, "File not found", 404);
  }
  if (Date.now() - (Number(m.created) || 0) > 7 * 24 * 3600 * 1000) {
    return shellPage(`<div class="icon">⏳</div><h1>This link has expired</h1><p class="meta">Files are kept for 7 days after upload.</p>`, "Link expired", 410);
  }
  const url = new URL(request.url);
  const wantDl = url.searchParams.get("dl") === "1";
  const f = m.files[n];
  const res = await sendFile(path.join(shareRoot(), id, String(n)), {
    mime: safeMime(f.type),
    filename: safeName(f.name),
    download: wantDl,
    rangeHeader: request.headers.get("range"),
  });
  if (!res) return shellPage(`<div class="icon">🔍</div><h1>File unavailable</h1>`, "File unavailable", 404);
  return res;
}
