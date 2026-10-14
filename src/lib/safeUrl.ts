import net from "node:net";
import { lookup } from "node:dns/promises";

/** Hostname lokal / intranet yang tidak boleh di-fetch server-side. */
const BLOCKED_SUFFIX = [
  "localhost",
  "local",
  "internal",
  "lan",
  "home",
  "corp",
  "intranet",
  "invalid",
  "test",
  "example",
];

/** true jika IP tidak boleh diakses dari server (loopback, privat, link-local, dsb). */
export function isBlockedIp(ip: string): boolean {
  let v = ip.trim().toLowerCase();
  // Unwrap IPv4-mapped IPv6 (::ffff:1.2.3.4) lalu nilai isi IPv4-nya.
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) v = mapped[1];
  if (net.isIPv4(v)) {
    const o = v.split(".").map(Number);
    const [a, b] = o;
    return (
      a === 0 || // 0.0.0.0/8
      a === 10 || // CGNAT? no — 10/8 privat
      a === 127 || // loopback
      (a === 172 && b >= 16 && b <= 31) || // privat
      (a === 192 && b === 168) || // privat
      (a === 169 && b === 254) || // link-local (cloud metadata!)
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      a >= 224 // multicast + reserved
    );
  }
  if (net.isIPv6(v)) {
    return (
      v === "::1" ||
      v === "::" ||
      v.startsWith("fe80:") || // link-local
      v.startsWith("fec0:") || // site-local (lama)
      v.startsWith("fc") || // unique-local fc00::/7
      v.startsWith("fd") ||
      v.startsWith("ff") // multicast
    );
  }
  return true; // tidak dikenal → blokir
}

function blockedHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (net.isIP(h)) return isBlockedIp(h);
  return BLOCKED_SUFFIX.some((s) => h === s || h.endsWith("." + s));
}

/**
 * Validasi URL publik http(s). Menolak kredensial di URL, hostname
 * internal, dan hostname yang resolve ke IP privat/loopback/link-local.
 * Mengembalikan URL ternormalisasi, atau throw bila diblokir.
 */
export async function assertPublicHttpUrl(input: string, maxLen = 2048): Promise<string> {
  let target = String(input || "").trim().slice(0, maxLen);
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error("Enter a valid public http(s) URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only http(s) URLs are allowed.");
  if (parsed.username || parsed.password) throw new Error("URLs with credentials are not allowed.");
  if (blockedHostname(parsed.hostname)) throw new Error("That host is not allowed.");
  if (!net.isIP(parsed.hostname)) {
    let addrs: string[];
    try {
      addrs = (await lookup(parsed.hostname, { all: true })).map((r) => r.address);
    } catch {
      throw new Error("Could not resolve that hostname.");
    }
    if (!addrs.length || addrs.some(isBlockedIp)) throw new Error("That host is not allowed.");
  }
  return parsed.toString();
}
