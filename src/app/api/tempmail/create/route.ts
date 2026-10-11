import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 30;
function rand(n: number) {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const b = new Uint32Array(n);
  crypto.getRandomValues(b);
  for (let i = 0; i < n; i++) s += c[b[i] % c.length];
  return s;
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const domRes = await fetch("https://api.mail.tm/domains", { cache: "no-store" });
    if (!domRes.ok) return NextResponse.json({ error: "Mail service unavailable" }, { status: 502 });
    const domJson = await domRes.json();
    const domains = (domJson["hydra:member"] || []).filter((d: { isActive: boolean }) => d.isActive).map((d: { domain: string }) => d.domain);
    if (!domains.length) return NextResponse.json({ error: "No mail domains available" }, { status: 502 });
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const local = (body.prefix ? String(body.prefix).toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30) : rand(10)) || rand(10);
    const address = `${local}@${domain}`;
    const password = rand(16);
    const accRes = await fetch("https://api.mail.tm/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, password }) });
    if (!accRes.ok) return NextResponse.json({ error: "Failed to create mailbox" }, { status: 502 });
    const tokRes = await fetch("https://api.mail.tm/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, password }) });
    if (!tokRes.ok) return NextResponse.json({ error: "Failed to open mailbox" }, { status: 502 });
    const tokJson = await tokRes.json();
    return NextResponse.json({ address, token: tokJson.token, domain });
  } catch {
    return NextResponse.json({ error: "Mailbox creation failed" }, { status: 500 });
  }
}
