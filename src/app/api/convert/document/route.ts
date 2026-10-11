import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 150;
let active = false;
const maxInput = 50 * 1024 * 1024;

function run(command: string, args: string[], timeout: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data: Buffer) => { if (stdout.length < 8192) stdout += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { if (stderr.length < 8192) stderr += data.toString(); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("TIMEOUT")); }, timeout);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && origin !== `https://${host}` && origin !== `http://${host}`) return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  if (active) return NextResponse.json({ error: "A conversion is already running. Try again shortly." }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > maxInput + 1024 * 1024) return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Upload a DOCX or PDF file." }, { status: 400 }); }
  const upload = form.get("file");
  const direction = form.get("direction");
  if (!(upload instanceof File) || !["docx-pdf", "pdf-docx"].includes(String(direction))) return NextResponse.json({ error: "Choose a valid file and conversion direction." }, { status: 400 });
  if (upload.size > maxInput) return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
  const docxToPdf = direction === "docx-pdf";
  const expectedExt = docxToPdf ? ".docx" : ".pdf";
  const outputExt = docxToPdf ? ".pdf" : ".docx";
  if (path.extname(upload.name).toLowerCase() !== expectedExt) return NextResponse.json({ error: `Select a ${expectedExt.slice(1).toUpperCase()} file.` }, { status: 415 });
  const buffer = Buffer.from(await upload.arrayBuffer());
  if (docxToPdf ? buffer.subarray(0, 2).toString() !== "PK" : buffer.subarray(0, 5).toString() !== "%PDF-") return NextResponse.json({ error: "File content does not match its extension." }, { status: 415 });

  active = true;
  let dir: string | undefined;
  try {
    dir = await mkdtemp(path.join(os.tmpdir(), "qword-doc-"));
    await chmod(dir, 0o1733);
    const inputName = `${randomUUID()}${expectedExt}`;
    const outputName = `${randomUUID()}${outputExt}`;
    const inputPath = path.join(dir, inputName);
    const outputPath = path.join(dir, outputName);
    await writeFile(inputPath, buffer, { mode: 0o644, flag: "wx" });
    const result = await run("docker", ["run", "--rm", "--network", "none", "--user", "1001:1001", "--memory", "1g", "--cpus", "1", "--pids-limit", "100", "--read-only", "--tmpfs", "/tmp:rw,nosuid,size=128m", "--mount", `type=bind,src=${dir},dst=/work`, "qword-doc-converter", inputName, outputName], 120000);
    if (result.code !== 0) throw new Error(result.stderr.includes("No such image") ? "CONVERTER_UNAVAILABLE" : "CONVERSION_FAILED");
    const outputStat = await stat(outputPath);
    if (!outputStat.size || outputStat.size > 100 * 1024 * 1024) return NextResponse.json({ error: "Generated file exceeds the 100 MB limit." }, { status: 422 });
    const data = await readFile(outputPath);
    const base = path.basename(upload.name, expectedExt).replace(/[\r\n"\\]/g, "_").slice(0, 120) || "converted";
    return new NextResponse(data, { headers: { "Content-Type": docxToPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${base}${outputExt}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "CONVERTER_UNAVAILABLE" ? 503 : 422;
    return NextResponse.json({ error: message === "TIMEOUT" ? "Conversion timed out." : message === "CONVERTER_UNAVAILABLE" ? "Document converter is not installed on this server yet." : "Could not convert this file. It may be damaged, encrypted, or unsupported." }, { status });
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
    active = false;
  }
}
