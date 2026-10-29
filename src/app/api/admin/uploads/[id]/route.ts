import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/prisma";
import { adminSession } from "@/lib/server/admin-auth";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
  svg: "image/svg+xml",
};

/**
 * Customer sketch for vectorisation. Always served as a download in a sandbox, never inline: an uploaded SVG
 * must not run in the admin's origin.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return Response.json({ error: "Neautorizat." }, { status: 401 });
  const { id } = await params;
  const match = id.match(/^[0-9a-f-]{36}\.(png|jpg|webp|heic|pdf|svg)$/);
  if (!match) return Response.json({ error: "Fișier necunoscut." }, { status: 404 });

  const item = await db().orderItem.findFirst({
    where: { customUploadUrl: id },
    select: { sketchName: true, order: { select: { number: true } } },
  });
  if (!item) return Response.json({ error: "Fișierul nu aparține niciunei comenzi." }, { status: 404 });

  let file: Buffer;
  try {
    file = await readFile(path.join(UPLOAD_DIR, path.basename(id)));
  } catch {
    return Response.json({ error: "Fișierul nu mai există pe server." }, { status: 404 });
  }
  const filename = `${item.order.number}_schita.${match[1]}`;
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": TYPES[match[1]],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
