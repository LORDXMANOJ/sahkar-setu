import QRCode from "qrcode";
import { configuredSiteUrl } from "@/lib/site";
import { formatCode, getSession } from "@/lib/attendance";
import { can, getCurrentUser } from "@/lib/auth";
import { getTrainee } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

// Live state for the trainer's screen: the code, its QR, and who is present.
// Session IDs are unguessable; in production this also checks the trainer's login.
export async function GET(request: Request, { params }: RouteContext<"/api/attendance/session/[id]">) {
  const { id } = await params;
  const limited = rateLimit(request, "session", 90, 60_000);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user || !can.runSessions(user)) return Response.json({ error: "Only trainers can view sessions." }, { status: 403 });
  const s = await getSession(id);
  // Trainers see only their own sessions.
  if (!s || s.trainerId !== user.id) return Response.json({ error: "Session not found." }, { status: 404 });

  const origin = configuredSiteUrl() ?? new URL(request.url).origin;
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
