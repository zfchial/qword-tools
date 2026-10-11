import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  try {
    const { token, id } = await request.json().catch(() => ({}));
    if (!token || !id) return NextResponse.json({ error: "Missing token or id" }, { status: 400 });
    if (!/^[a-zA-Z0-9]+$/.test(String(id))) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const res = await fetch(`https://api.mail.tm/messages/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Message unavailable" }, { status: 502 });
    const m = await res.json();
    return NextResponse.json({ id: m.id || id, from: m.from?.address || m.from?.name || "", subject: m.subject || "", text: m.text || "", html: m.html || "", createdAt: m.createdAt || "" });
  } catch {
    return NextResponse.json({ error: "Failed to read message" }, { status: 500 });
  }
}
