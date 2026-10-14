import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";

export const SHARE_MAX_AGE = 7 * 24 * 3600 * 1000;
export const SHARE_ID_RE = /^[A-Za-z0-9_-]{6,16}$/;

export type ShareFile = { name: string; type: string; size: number };
export type ShareEntry = {
  name?: string;
  type?: string;
  size: number;
  created: number;
  folder?: boolean;
  files?: ShareFile[];
};

export function esc(s: string) {
  return String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

export function fmtSize(bytes: number) {
  const n = Number(bytes) || 0;
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
  if (n >= 1048576) return (n / 1048576).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}

export function safeMime(t: unknown) {
  const m = String(t || "application/octet-stream").slice(0, 120);
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(m) ? m : "application/octet-stream";
}

export function safeName(n: unknown) {
  return String(n || "file").replace(/[\r\n"\\]/g, "_").slice(0, 120) || "file";
}

export type PreviewKind = "video" | "image" | "audio" | "pdf" | "text" | "other";

export function kindOf(mime: string): PreviewKind {
  const m = mime.toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("text/") || m === "application/json") return "text";
  return "other";
}

export function fileIcon(mime: string) {
  switch (kindOf(mime)) {
    case "video": return "🎬";
    case "image": return "🖼️";
    case "audio": return "🎵";
    case "pdf": return "📕";
    case "text": return "📝";
    default: return "📦";
  }
}

/** Inline preview element for a file. rawUrl must serve bytes with ?raw semantics. */
export function previewHtml(mime: string, rawUrl: string, name: string) {
  const src = esc(rawUrl);
  const alt = esc(name);
  switch (kindOf(mime)) {
    case "video":
      return `<video controls preload="metadata" playsinline src="${src}" class="preview-media"></video>`;
    case "image":
      return `<img src="${src}" alt="${alt}" loading="lazy" class="preview-media">`;
    case "audio":
      return `<audio controls preload="none" src="${src}" class="preview-audio"></audio>`;
    case "pdf":
    case "text":
      return `<iframe src="${src}" title="${alt}" loading="lazy" class="preview-frame"></iframe>`;
    default:
      return "";
  }
}

const BASE_CSS = `:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5ef;color:#17221d;font-family:Arial,Helvetica,sans-serif;padding:24px}@media(prefers-color-scheme:dark){body{background:#101612;color:#e8eee9}}.card{max-width:640px;width:100%;background:#fff;border:1px solid #dce4dc;border-radius:16px;padding:32px 28px;box-shadow:0 12px 40px rgba(0,0,0,.08)}@media(prefers-color-scheme:dark){.card{background:#1a211c;border-color:#344238}}.icon{font-size:52px;line-height:1;margin-bottom:12px;text-align:center}h1{font-size:22px;margin:0 0 6px;word-break:break-word;text-align:center}.meta{text-align:center;color:#4b5850;font-size:14px;margin:0 0 8px}@media(prefers-color-scheme:dark){.meta{color:#c2cdc4}}.center{text-align:center}.btn{display:inline-block;margin-top:16px;background:#315f40;color:#fff!important;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;border:0;cursor:pointer;font-size:15px}@media(prefers-color-scheme:dark){.btn{background:#a3d9b1;color:#101612!important}}.btn-secondary{display:inline-block;margin-top:12px;margin-left:8px;background:transparent;color:#315f40!important;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none;border:1px solid #315f40;cursor:pointer;font-size:14px}@media(prefers-color-scheme:dark){.btn-secondary{color:#a3d9b1!important;border-color:#a3d9b1}}.small{font-size:13px;margin-top:14px;text-align:center}.mono{font-family:monospace;word-break:break-all}.preview-media{width:100%;max-height:360px;border-radius:12px;background:#000;margin-top:14px}img.preview-media{background:transparent;object-fit:contain}.preview-audio{width:100%;margin-top:14px}.preview-frame{width:100%;height:420px;border:1px solid #dce4dc;border-radius:12px;margin-top:14px;background:#fff}.filelist{margin:16px 0 0;padding:0;list-style:none}.filelist details{border:1px solid #dce4dc;border-radius:12px;margin-bottom:10px;overflow:hidden}@media(prefers-color-scheme:dark){.filelist details{border-color:#344238}}.filelist summary{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;list-style:none}.filelist summary::-webkit-details-marker{display:none}.filelist summary:hover{background:rgba(0,0,0,.03)}.fname{font-weight:700;word-break:break-all;flex:1}.fsize{font-size:12px;color:#4b5850;white-space:nowrap}@media(prefers-color-scheme:dark){.fsize{color:#c2cdc4}}.frow-actions{display:flex;gap:8px;padding:0 14px 12px}.mini{background:transparent;border:1px solid #315f40;color:#315f40!important;font-weight:700;font-size:13px;padding:7px 14px;border-radius:8px;text-decoration:none;cursor:pointer}@media(prefers-color-scheme:dark){.mini{border-color:#a3d9b1;color:#a3d9b1!important}}.fpreview{padding:0 14px 14px}.nopreview{padding:0 14px 14px;font-size:13px;color:#4b5850}@media(prefers-color-scheme:dark){.nopreview{color:#c2cdc4}}`;

export function shellPage(inner: string, title: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Qword Tools</title><style>${BASE_CSS}</style></head><body><div class="card">${inner}</div></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Tipe yang bisa mengeksekusi script/active content bila dibuka inline
 * di origin kita (XSS via file upload). Selalu paksa download.
 * Catatan: SVG di dalam <img> preview tetap aman (browser tidak
 * mengeksekusi script dalam konteks image).
 */
const FORCE_DOWNLOAD_MIME = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/xml",
  "application/xml",
]);

/**
 * Stream a file from disk with HTTP Range support (penting agar video/audio
 * bisa di-seek di browser) tanpa memuat seluruh file ke memori.
 */
export async function sendFile(
  absPath: string,
  opts: { mime: string; filename: string; download: boolean; rangeHeader: string | null },
) {
  const st = await stat(absPath).catch(() => undefined);
  if (!st || !st.isFile()) return null;
  const total = st.size;
  const risky = FORCE_DOWNLOAD_MIME.has(opts.mime.toLowerCase());
  const disp = opts.download || risky ? "attachment" : "inline";
  const baseHeaders: Record<string, string> = {
    "Content-Type": opts.mime,
    "Content-Disposition": `${disp}; filename="${opts.filename}"`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  const range = opts.rangeHeader || "";
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m && (m[1] !== "" || m[2] !== "")) {
    let start = m[1] === "" ? Math.max(0, total - Number(m[2] || 0)) : Number(m[1]);
    let end = m[2] === "" ? total - 1 : Number(m[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= total) {
      return new Response("Requested range not satisfiable.", {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }
    end = Math.min(end, total - 1);
    const chunkLen = end - start + 1;
    const nodeStream = createReadStream(absPath, { start, end });
    const body = Readable.toWeb(nodeStream) as unknown as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunkLen),
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
    });
  }
  const nodeStream = createReadStream(absPath);
  const body = Readable.toWeb(nodeStream) as unknown as ReadableStream;
  return new Response(body, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}

export function shareRoot() {
  return path.join(process.cwd(), "data", "share");
}
