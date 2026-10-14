import type { NextRequest } from "next/server";

const buckets = new Map<string, number[]>();

/** In-memory per-IP rate limiter (single instance). true = diizinkan. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 10000) {
    const oldest = [...buckets.keys()].slice(0, 2000);
    for (const k of oldest) buckets.delete(k);
  }
  return true;
}

export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first.slice(0, 64);
  }
  return "direct";
}

export function rateLimited(request: NextRequest, name: string, limit: number, windowMs: number): boolean {
  return !rateLimit(`${name}:${clientIp(request)}`, limit, windowMs);
}
