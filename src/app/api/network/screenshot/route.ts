import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl } from "@/lib/safeUrl";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 90;
let active = false;

const EXECUTABLE = process.env.SCREENSHOT_CHROME || "/home/nano/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const WIDTHS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (rateLimited(request, "shot", 10, 60 * 1000)) return NextResponse.json({ error: "Too many screenshots. Slow down." }, { status: 429 });
  if (active) return NextResponse.json({ error: "A screenshot is already running. Try again shortly." }, { status: 429 });
  let body: { url?: string; device?: string; fullPage?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 }); }
  let target: string;
  try {
    target = await assertPublicHttpUrl(body.url || "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Enter a valid public http(s) URL." }, { status: 400 });
  }
  const viewport = WIDTHS[String(body.device || "desktop")] || WIDTHS.desktop;
  const fullPage = body.fullPage !== false;
  active = true;
  let dir: string | undefined;
  const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage"] }).catch(() => undefined);
  if (!browser) { active = false; return NextResponse.json({ error: "Screenshot service is unavailable." }, { status: 503 }); }
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-shot-"));
    const shotPath = path.join(dir, "shot.png");
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(target, { timeout: 30000, waitUntil: "networkidle" });
    } catch {
      await page.goto(target, { timeout: 30000, waitUntil: "domcontentloaded" });
    }
    // Situs bisa redirect ke host internal — validasi URL akhir juga.
    try {
      await assertPublicHttpUrl(page.url());
    } catch {
      await page.close();
      return NextResponse.json({ error: "That page redirects somewhere not allowed." }, { status: 400 });
    }
    await page.screenshot({ path: shotPath, fullPage, timeout: 20000 });
    await page.close();
    const outputStat = await stat(shotPath);
    if (!outputStat.size || outputStat.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Screenshot failed or exceeded the size limit." }, { status: 422 });
    const data = await readFile(shotPath);
    const filename = `screenshot-${viewport.width}x${viewport.height}.png`;
    return new NextResponse(data, { headers: { "Content-Type": "image/png", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not capture this page. It may be down, blocking bots, or too slow." }, { status: 422 });
  } finally {
    await browser.close().catch(() => undefined);
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
