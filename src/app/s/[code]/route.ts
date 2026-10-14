import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function esc(s: string) {
  return String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] || c);
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^[A-Za-z0-9]{4,16}$/.test(code)) return NextResponse.json({ error: "Unknown short link." }, { status: 404 });
  try {
    const store = JSON.parse(await readFile(path.join(process.cwd(), "data", "shortlinks.json"), "utf8"));
    const hit = store[code];
    if (hit && typeof hit.url === "string" && /^https?:\/\//.test(hit.url)) {
      const url = new URL(request.url);
      // Langsung redirect hanya setelah user klik Continue — anti penyalahgunaan
      // shortlink untuk phishing berkedok domain tepercaya.
      if (url.searchParams.get("go") === "1") return NextResponse.redirect(hit.url, 307);
      let host = "";
      try {
        host = new URL(hit.url).hostname;
      } catch {
        host = hit.url;
      }
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leaving Qword Tools</title><style>:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5ef;color:#17221d;font-family:Arial,Helvetica,sans-serif;padding:24px}@media(prefers-color-scheme:dark){body{background:#101612;color:#e8eee9}}.card{max-width:520px;width:100%;background:#fff;border:1px solid #dce4dc;border-radius:16px;padding:36px 32px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.08)}@media(prefers-color-scheme:dark){.card{background:#1a211c;border-color:#344238}}.icon{font-size:52px;line-height:1;margin-bottom:12px}h1{font-size:24px;margin:0 0 10px}p{color:#4b5850;font-size:15px;line-height:1.7;margin:0 0 8px}@media(prefers-color-scheme:dark){p{color:#c2cdc4}}.btn{display:inline-block;margin-top:20px;background:#315f40;color:#fff!important;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none}@media(prefers-color-scheme:dark){.btn{background:#a3d9b1;color:#101612!important}}.small{font-size:13px;margin-top:14px}.mono{font-family:monospace;word-break:break-all}</style></head><body><div class="card"><div class="icon">🔗</div><h1>You are leaving Qword Tools</h1><p>This short link goes to:</p><p class="mono"><strong>${esc(host)}</strong></p><p class="mono" style="font-size:12px">${esc(hit.url.slice(0, 300))}</p><p>Only continue if you trust this destination.</p><a class="btn" href="/s/${esc(code)}?go=1" rel="nofollow noopener">Continue to site</a><p class="small"><a href="/">← Back to Qword Tools</a></p></div></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
  } catch {}
  return NextResponse.json({ error: "Unknown or expired short link." }, { status: 404 });
}
