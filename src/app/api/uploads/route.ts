import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { saveSketch } from "@/lib/server/sketches";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, UPLOAD_FORMATS_LABEL } from "@/lib/uploads";

// Customer sketches and logos for vectorisation. Files are stored privately in the database and never served
// back from this route; only the admin portal downloads them (GET /api/admin/uploads/[id]).

export const runtime = "nodejs";

interface Kind {
  ext: string;
  type: string;
}

const ascii = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));

/** Identifies the file from its magic bytes — the browser-supplied MIME type is not trusted. */
function sniff(bytes: Uint8Array): Kind | null {
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return { ext: "png", type: "image/png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { ext: "webp", type: "image/webp" };
  if (ascii(bytes, 4, 4) === "ftyp" && ["heic", "heix", "heif", "mif1", "msf1"].includes(ascii(bytes, 8, 4))) {
    return { ext: "heic", type: "image/heic" };
  }
  if (ascii(bytes, 0, 5) === "%PDF-") return { ext: "pdf", type: "application/pdf" };
  const head = new TextDecoder().decode(bytes.subarray(0, 1024)).replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) {
    return { ext: "svg", type: "image/svg+xml" };
  }
  return null;
}

function displayName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "schita";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120) || "schita";
}

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });
const TOO_LARGE = `Fișierul depășește ${MAX_UPLOAD_MB} MB.`;

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, TOO_LARGE);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Încărcarea nu a putut fi citită.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Alege un fișier.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, TOO_LARGE);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return fail(415, `Acceptăm ${UPLOAD_FORMATS_LABEL}.`);

  const id = `${randomUUID()}.${kind.ext}`;
  const name = displayName(file.name);
  try {
    await saveSketch({ id, name, type: kind.type, bytes });
  } catch (error) {
    console.error("Sketch upload failed", error);
    return fail(500, "Nu am putut salva fișierul. Încearcă din nou.");
  }

  return NextResponse.json({ id, name, size: file.size, type: kind.type }, { status: 201 });
}
