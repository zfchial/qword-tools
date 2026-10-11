import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json().catch(() => ({}));
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    const res = await fetch("https://api.mail.tm/messages", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Inbox unavailable" }, { status: 502 });
    const data = await res.json();
    const list = (data["hydra:member"] || []).map((m: { id: string; from?: { address?: string; name?: string }; subject?: string; intro?: string; seen?: boolean; createdAt?: string }) => ({ id: m.id, from: m.from?.address || m.from?.name || "", subject: m.subject || "", intro: m.intro || "", seen: !!m.seen, createdAt: m.createdAt || "" }));
    return NextResponse.json({ messages: list });
  } catch {
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
