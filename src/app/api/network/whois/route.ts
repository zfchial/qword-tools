import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const UA = { Accept: "application/rdap+json, application/json", "User-Agent": "QwordTools-Whois/1.0" };

let bootstrapCache: { at: number; services: string[][][] } | undefined;

function cleanHostname(raw: string) {
  let host = raw.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split("#")[0].split("@").pop() || "";
  host = host.split(":")[0].replace(/\.$/, "");
  if (!host.includes(".")) return "";
  if (host.length > 253 || !/^[a-z0-9.-]+$/.test(host)) return "";
  const labels = host.split(".");
  if (labels.some((label) => !label || label.length > 63)) return "";
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return "";
  return host;
}

async function fetchJson(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: UA });
    if (response.status === 404) return { status: 404 as const };
    if (!response.ok) return { status: "error" as const };
    return { status: 200 as const, data: await response.json() };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timer);
  }
}

async function rdapServers(tld: string): Promise<string[]> {
  if (!bootstrapCache || Date.now() - bootstrapCache.at > 24 * 3600 * 1000) {
    const result = await fetchJson("https://data.iana.org/rdap/dns.json", 12000);
    if (result.status !== 200) return [];
    bootstrapCache = { at: Date.now(), services: (result.data as { services: string[][][] }).services || [] };
  }
  const out: string[] = [];
  for (const [tlds, urls] of bootstrapCache.services) {
    if (tlds.includes(tld)) out.push(...urls);
  }
  return out;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  let body: { domain?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a JSON body with a domain field." }, { status: 400 }); }
  const domain = cleanHostname(String(body.domain || ""));
  if (!domain) return NextResponse.json({ error: "Enter a valid domain name, for example example.com." }, { status: 400 });
  const servers = await rdapServers(domain.split(".").pop() || "");
  if (!servers.length) return NextResponse.json({ error: "WHOIS lookup failed. The RDAP bootstrap service may be unavailable." }, { status: 502 });
  let sawError = false;
  for (const base of servers.slice(0, 3)) {
    const url = base.replace(/\/?$/, "/") + "domain/" + encodeURIComponent(domain);
    const result = await fetchJson(url, 12000);
    if (result.status === 200) return NextResponse.json({ domain, source: "rdap", data: result.data }, { headers: { "Cache-Control": "no-store" } });
    if (result.status === 404) return NextResponse.json({ error: "No WHOIS record found for this domain." }, { status: 404 });
    sawError = true;
  }
  return NextResponse.json({ error: sawError ? "WHOIS lookup failed. The RDAP service may be unavailable." : "No WHOIS record found for this domain." }, { status: sawError ? 502 : 404 });
}
