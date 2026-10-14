import { NextRequest, NextResponse } from "next/server";
import { assertPublicHttpUrl } from "@/lib/safeUrl";
import { rateLimited } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_REDIRECTS = 5;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  let body: { url?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 }); }
  let target: string;
  try {
    target = await assertPublicHttpUrl(body.url || "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Enter a valid public http(s) URL." }, { status: 400 });
  }
  const chain: { url: string; status: number; headers: Record<string, string> }[] = [];
  if (rateLimited(request, "headers", 30, 60 * 1000)) return NextResponse.json({ error: "Too many checks. Slow down." }, { status: 429 });
  try {
    let current = target;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Validasi ulang tiap hop — redirect ke host internal dilarang.
      try {
        current = await assertPublicHttpUrl(current);
      } catch {
        return NextResponse.json({ error: "That URL redirects somewhere not allowed.", url: target, chain }, { status: 400 });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      let response: Response;
      try {
        response = await fetch(current, { method: "HEAD", redirect: "manual", signal: controller.signal, headers: { "User-Agent": "QwordTools-HeadersCheck/1.0" } });
      } finally {
        clearTimeout(timer);
      }
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => { if (headers[key] === undefined) headers[key] = value; });
      chain.push({ url: current, status: response.status, headers });
      await response.arrayBuffer().catch(() => undefined);
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, current).toString();
        if (!current.startsWith("http://") && !current.startsWith("https://")) break;
        continue;
      }
      break;
    }
    return NextResponse.json({ url: target, chain }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not fetch headers. The site may be down or blocking requests." }, { status: 502 });
  }
}
