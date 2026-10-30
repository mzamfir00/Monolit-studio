import { db } from "@/lib/prisma";
import { adminSession } from "@/lib/server/admin-auth";
import { readSketch } from "@/lib/server/sketches";
import { SKETCH_ID } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Customer sketch for vectorisation. Always served as a download in a sandbox, never inline: an uploaded SVG
 * must not run in the admin's origin.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return Response.json({ error: "Neautorizat." }, { status: 401 });
  const { id } = await params;
  const match = id.match(SKETCH_ID);
  if (!match) return Response.json({ error: "Fișier necunoscut." }, { status: 404 });

  const item = await db().orderItem.findFirst({
    where: { customUploadUrl: id },
    select: { sketchName: true, order: { select: { number: true } } },
  });
  if (!item) return Response.json({ error: "Fișierul nu aparține niciunei comenzi." }, { status: 404 });

  const file = await readSketch(id);
  if (!file) return Response.json({ error: "Fișierul nu mai există pe server." }, { status: 404 });
  const filename = `${item.order.number}_schita.${match[1]}`;
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
