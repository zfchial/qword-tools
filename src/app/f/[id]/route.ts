import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(id)) return NextResponse.json({ error: "File not found." }, { status: 404 });
  const dir = path.join(process.cwd(), "data", "share");
  try {
    const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf8"));
    const m = meta[id];
    if (!m) return NextResponse.json({ error: "File not found or expired." }, { status: 404 });
    if (Date.now() - m.created > 7 * 24 * 3600 * 1000) return NextResponse.json({ error: "File link has expired." }, { status: 410 });
    const data = await readFile(path.join(dir, id));
    const name = String(m.name || "file").replace(/[\r\n"\\]/g, "_");
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found or expired." }, { status: 404 });
  }
}
