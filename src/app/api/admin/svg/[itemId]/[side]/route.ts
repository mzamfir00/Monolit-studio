import { getFont, initialsFrom, type FontKey } from "@/lib/engraving";
import { buildGravostyleSvg, gravostyleFilename, type ExportSide } from "@/lib/gravostyle-svg";
import { getOrderByItem, specForItem } from "@/lib/server/admin";
import { adminSession } from "@/lib/server/admin-auth";
import { getSymbol } from "@/lib/symbols";

export const runtime = "nodejs";

const SIDES: Record<string, ExportSide> = { fata: "front", verso: "back" };

/** GET /api/admin/svg/{itemId}/fata|verso → Gravostyle-ready SVG sized in millimetres. */
export async function GET(_request: Request, { params }: { params: Promise<{ itemId: string; side: string }> }) {
  if (!(await adminSession())) return Response.json({ error: "Neautorizat." }, { status: 401 });
  const { itemId, side: sideParam } = await params;
  const side = SIDES[sideParam];
  if (!side) return Response.json({ error: "Fața trebuie să fie „fata” sau „verso”." }, { status: 400 });

  const order = await getOrderByItem(itemId);
  const item = order?.items.find((candidate) => candidate.id === itemId);
  if (!order || !item) return Response.json({ error: "Piesa nu există." }, { status: 404 });
  if (side === "back" && item.engravingSides !== "FRONT_AND_BACK") {
    return Response.json({ error: "Această piesă nu are gravură pe verso." }, { status: 404 });
  }
  const spec = specForItem(item);
  if (!spec) return Response.json({ error: "Lipsesc dimensiunile semifabricatului." }, { status: 422 });

  const job = {
    spec,
    side,
    lines: side === "front" ? item.frontLines : item.backLines,
    font: getFont(item.fontKey as FontKey),
    symbol: getSymbol(item.symbolKey) ?? null,
    initials: initialsFrom(item.frontLines),
    sketchName: item.sketchName,
    orderNumber: order.number,
    productName: item.productName,
  };
  const filename = gravostyleFilename(job);
  return new Response(buildGravostyleSvg(job), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
