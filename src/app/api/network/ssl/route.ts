import { connect } from "node:tls";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function cleanHostname(raw: string) {
  const host = raw.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(":")[0].replace(/\.$/, "");
  if (!host || host.length > 253 || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return "";
  return host;
}

function checkTls(host: string, timeoutMs: number) {
  return new Promise<{ cert: Record<string, unknown>; authorized: boolean; authError: string }>((resolve, reject) => {
    const socket = connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate(true) as unknown as Record<string, unknown>;
      const authorized = socket.authorized;
      const authError = typeof socket.authorizationError === "string" ? socket.authorizationError : (socket.authorizationError as Error | undefined)?.message || "";
      socket.end();
      if (!cert || !Object.keys(cert).length) reject(new Error("NO_CERT"));
      else resolve({ cert, authorized, authError });
    });
    socket.setTimeout(timeoutMs, () => { socket.destroy(); reject(new Error("TIMEOUT")); });
    socket.on("error", (error) => reject(error));
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  let body: { host?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a JSON body with a host field." }, { status: 400 }); }
  const target = cleanHostname(String(body.host || ""));
  if (!target) return NextResponse.json({ error: "Enter a valid hostname, for example example.com." }, { status: 400 });
  try {
    const { cert, authorized, authError } = await checkTls(target, 12000);
    const subject = cert.subject as Record<string, string> | undefined;
    const issuer = cert.issuer as Record<string, string> | undefined;
    const info = cert.infoAccess as Record<string, string[]> | undefined;
    return NextResponse.json({
      host: target,
      subject: subject?.CN || "",
      issuer: issuer?.O || issuer?.CN || "",
      validFrom: cert.valid_from as string,
      validTo: cert.valid_to as string,
      daysLeft: Math.ceil((new Date(cert.valid_to as string).getTime() - Date.now()) / 86400000),
      san: ((cert.subjectaltname as string) || "").replace(/DNS:/g, "").split(", ").filter(Boolean),
      fingerprint: cert.fingerprint as string,
      serial: cert.serialNumber as string,
      trusted: authorized,
      trustError: authorized ? "" : authError,
      ocsp: info?.["OCSP - URI"] || [],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read a TLS certificate from this host. It may not support HTTPS." }, { status: 502 });
  }
}
