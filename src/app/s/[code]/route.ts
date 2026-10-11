import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^[A-Za-z0-9]{4,16}$/.test(code)) return NextResponse.json({ error: "Unknown short link." }, { status: 404 });
  try {
    const store = JSON.parse(await readFile(path.join(process.cwd(), "data", "shortlinks.json"), "utf8"));
    const hit = store[code];
    if (hit && typeof hit.url === "string" && /^https?:\/\//.test(hit.url)) return NextResponse.redirect(hit.url, 307);
  } catch {}
  return NextResponse.json({ error: "Unknown or expired short link." }, { status: 404 });
}
