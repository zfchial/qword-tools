import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const maxDuration = 30;
const dir = path.join(process.cwd(), "data");
const file = path.join(dir, "shortlinks.json");
type Store = Record<string, { url: string; created: number }>;
async function load(): Promise<Store> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return {};
  }
}
const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function code(n = 6) {
  const buf = randomBytes(n);
  let s = "";
  for (let i = 0; i < n; i++) s += chars[buf[i] % chars.length];
  return s;
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a url field." }, { status: 400 });
  }
  if (rateLimited(request, "short", 20, 60 * 1000)) return NextResponse.json({ error: "Too many links. Slow down." }, { status: 429 });
  let target = String(body.url || "").trim().slice(0, 2048);
  if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
  try {
    const parsed = new URL(target);
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || !parsed.hostname) throw new Error("bad");
    target = parsed.toString();
  } catch {
    return NextResponse.json({ error: "Enter a valid public http(s) URL." }, { status: 400 });
  }
  const store = await load();
  let c = code();
  while (store[c]) c = code();
  store[c] = { url: target, created: Date.now() };
  await mkdir(dir, { recursive: true });
  await writeFile(file, JSON.stringify(store), { mode: 0o600 });
  return NextResponse.json({ code: c, url: target });
}
