import "server-only";
import { db } from "@/lib/prisma";
import { SKETCH_ID } from "@/lib/uploads";

// Customer sketches live in PostgreSQL (table "Upload") rather than on disk, so the app runs on serverless
// hosting without a writable filesystem. Ids are "<uuid>.<ext>"; OrderItem.customUploadUrl stores the id.

export async function saveSketch(sketch: { id: string; name: string; type: string; bytes: Uint8Array<ArrayBuffer> }) {
  await db().upload.create({
    data: { id: sketch.id, name: sketch.name, type: sketch.type, size: sketch.bytes.byteLength, data: sketch.bytes },
  });
}

export async function sketchExists(id: string): Promise<boolean> {
  if (!SKETCH_ID.test(id)) return false;
  return (await db().upload.count({ where: { id } })) > 0;
}

export async function readSketch(id: string) {
  if (!SKETCH_ID.test(id)) return null;
  return db().upload.findUnique({ where: { id }, select: { type: true, data: true } });
}
