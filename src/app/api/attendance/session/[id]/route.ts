import QRCode from "qrcode";
import { formatCode, getSession } from "@/lib/attendance";
import { getTrainee } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

// Live state for the trainer's screen: the code, its QR, and who is present.
// Session IDs are unguessable; in production this also checks the trainer's login.
export async function GET(request: Request, { params }: RouteContext<"/api/attendance/session/[id]">) {
  const { id } = await params;
  const limited = rateLimit(request, "session", 90, 60_000);
  if (limited) return limited;

  const s = getSession(id);
  if (!s) return Response.json({ error: "Session not found." }, { status: 404 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
  const link = `${origin}/a/${s.code}`;
  const qr = QRCode.create(link, { errorCorrectionLevel: "M" });

  return Response.json(
    {
      id: s.id,
      title: s.title,
      room: s.room,
      code: formatCode(s.code),
      link,
      open: s.endedAt === null,
      requireSameNetwork: s.requireSameNetwork,
      qr: { size: qr.modules.size, bits: Array.from(qr.modules.data, (b) => (b ? "1" : "0")).join("") },
      present: s.marks.map((m) => ({ id: m.traineeId, name: getTrainee(m.traineeId)?.name ?? m.traineeId, at: m.at })),
      flags: s.flags.slice(-10),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
