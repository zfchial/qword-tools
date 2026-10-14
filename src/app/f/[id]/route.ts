import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  SHARE_ID_RE,
  SHARE_MAX_AGE,
  ShareEntry,
  esc,
  fileIcon,
  fmtSize,
  kindOf,
  previewHtml,
  safeMime,
  safeName,
  sendFile,
  shareRoot,
  shellPage,
} from "@/lib/share";

export const runtime = "nodejs";

type Meta = Record<string, ShareEntry>;

async function loadMeta(): Promise<Meta> {
  try {
    return JSON.parse(await readFile(path.join(shareRoot(), "meta.json"), "utf8"));
  } catch {
    return {};
  }
}

async function saveMeta(meta: Meta) {
  await writeFile(path.join(shareRoot(), "meta.json"), JSON.stringify(meta), { mode: 0o600 }).catch(() => undefined);
}

function notFoundPage(id: string, title: string, text: string, status: number) {
  return shellPage(
    `<div class="icon">🔍</div><h1>${title}</h1><p class="meta">${text}</p><p class="small mono">Link ID: ${esc(id)}</p><div class="center"><a class="btn" href="/tool/file-share-link">Upload a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p></div>`,
    title,
    status,
  );
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!SHARE_ID_RE.test(id)) return notFoundPage(id, "Link not found", "This download link doesn't exist.", 404);
  const url = new URL(request.url);
  const wantRaw = url.searchParams.get("raw") === "1";
  const wantDl = url.searchParams.get("dl") === "1";

  const meta = await loadMeta();
  const m = meta[id];
  if (!m) return notFoundPage(id, "Link not found", "This file is no longer available. It may have expired (files are kept for 7 days) or been removed.", 404);

  const created = Number(m.created) || 0;
  if (Date.now() - created > SHARE_MAX_AGE) {
    const days = Math.floor((Date.now() - created) / (24 * 3600 * 1000));
    await rm(path.join(shareRoot(), id), { recursive: true, force: true }).catch(() => undefined);
    delete meta[id];
    await saveMeta(meta);
    return shellPage(
      `<div class="icon">⏳</div><h1>This link has expired</h1><p class="meta">This share was created more than 7 days ago (${days} days) and has been deleted automatically.</p><p class="meta">Ask the sender to upload it again, or share a new file yourself — free up to 1 GB.</p><div class="center"><a class="btn" href="/tool/file-share-link">Share a new file</a><p class="small"><a href="/">← Back to Qword Tools</a></p></div>`,
      "Link expired",
      410,
    );
  }

  // ---- Folder share: direktori berisi N file ----
  if (m.folder) {
    const files = Array.isArray(m.files) ? m.files : [];
    if (wantRaw || wantDl) {
      // /f/<folder>?raw=1 tanpa index tidak valid — arahkan ke halaman preview.
      return Response.redirect(new URL(`/f/${id}`, url.origin).toString(), 302);
    }
    const rows = files
      .map((f, n) => {
        const mime = safeMime(f.type);
        const name = safeName(f.name);
        const pv = previewHtml(mime, `/f/${id}/${n}?raw=1`, name);
        const body = pv
          ? `<div class="fpreview">${pv}</div>`
          : `<div class="nopreview">No preview available for this file type — download to view it.</div>`;
        return `<li><details><summary><span style="font-size:22px">${fileIcon(mime)}</span><span class="fname">${esc(name)}</span><span class="fsize">${esc(fmtSize(f.size))}</span></summary>${body}<div class="frow-actions"><a class="mini" href="/f/${id}/${n}?dl=1">⬇ Download</a><a class="mini" href="/f/${id}/${n}?raw=1" target="_blank" rel="noopener">↗ Open</a></div></details></li>`;
      })
      .join("");
    return shellPage(
      `<div class="icon">📁</div><h1>Shared folder · ${files.length} file${files.length === 1 ? "" : "s"}</h1><p class="meta">${esc(fmtSize(m.size))} total · expires 7 days after upload · click a file to preview</p><ul class="filelist">${rows || `<li><p class="meta">This folder is empty.</p></li>`}</ul><div class="center"><p class="small"><a href="/">← Back to Qword Tools</a></p></div>`,
      `Shared folder (${files.length} files)`,
    );
  }

  // ---- Single file share ----
  const mime = safeMime(m.type);
  const name = safeName(m.name);
  const absPath = path.join(shareRoot(), id);
  if (wantRaw || wantDl) {
    const res = await sendFile(absPath, {
      mime,
      filename: name,
      download: wantDl,
      rangeHeader: request.headers.get("range"),
    });
    if (!res) {
      delete meta[id];
      await saveMeta(meta);
      return notFoundPage(id, "File unavailable", "The file data is missing on the server even though the link record exists.", 404);
    }
    return res;
  }
  const pv = previewHtml(mime, `/f/${id}?raw=1`, name);
  const kindLabel =
    kindOf(mime) === "other" ? "Download this file to view it." : kindOf(mime) === "video" ? "Watch it right here, or download it below." : "Preview it right here, or download it below.";
  return shellPage(
    `<div class="icon">${fileIcon(mime)}</div><h1>${esc(name)}</h1><p class="meta">${esc(fmtSize(m.size))} · ${esc(mime)} · expires 7 days after upload</p><p class="meta">${kindLabel}</p>${pv}<div class="center"><a class="btn" href="/f/${id}?dl=1">⬇ Download${m.size ? ` (${esc(fmtSize(m.size))})` : ""}</a><div><a class="btn-secondary" href="/f/${id}?raw=1" target="_blank" rel="noopener">↗ Open in browser</a></div><p class="small"><a href="/">← Back to Qword Tools</a></p></div>`,
    name,
  );
}
