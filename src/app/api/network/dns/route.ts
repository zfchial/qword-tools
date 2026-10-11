import { randomUUID } from "node:crypto";
import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"] as const;

function cleanHostname(raw: string) {
  let host = raw.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split("#")[0].split("@").pop() || "";
  host = host.split(":")[0].replace(/\.$/, "");
  return host;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  let body: { domain?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a JSON body with a domain field." }, { status: 400 }); }
  const domain = cleanHostname(String(body.domain || ""));
  if (!domain || domain.length > 253 || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return NextResponse.json({ error: "Enter a valid domain name, for example example.com." }, { status: 400 });
  const id = randomUUID().slice(0, 8);
  const results: Record<string, { ok: boolean; values: string[]; error?: string }> = {};
  await Promise.all(TYPES.map(async (type) => {
    try {
      const records = (await dns.resolve(domain, type)) as unknown;
      const list = (Array.isArray(records) ? records : [records]) as { exchange?: string; priority?: number }[];
      const values = list.map((record) => {
        if (typeof record === "string") return record;
        if (type === "MX" && record.exchange !== undefined) return `${record.priority ?? 0} ${record.exchange}`;
        return JSON.stringify(record);
      });
      results[type] = { ok: true, values };
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String((error as { code: string }).code) : "LOOKUP_FAILED";
      results[type] = { ok: false, values: [], error: code };
    }
    void id;
  }));
  return NextResponse.json({ domain, results }, { headers: { "Cache-Control": "no-store" } });
}
