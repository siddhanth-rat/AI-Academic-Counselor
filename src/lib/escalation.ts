import { prisma } from "@/lib/prisma";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isOutsideCounselorHours(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find(p => p.type === "hour")?.value);
  const minute = Number(parts.find(p => p.type === "minute")?.value);

  if (hour < 9) return true;
  if (hour > 17) return true;
  if (hour === 17 && minute >= 30) return true;
  
  return false;
}

export async function resolveUnavailableEscalations() {
  const now = new Date();
  const outsideHours = isOutsideCounselorHours(now);
  const pending = await prisma.session.findMany({
    where: {
      status: "PENDING_ESCALATION",
      ...(outsideHours ? {} : { updated_at: { lte: new Date(now.getTime() - FIVE_MINUTES_MS) } }),
    },
    select: { id: true },
  });

  const content = outsideHours
    ? "Our counselors are available from 9 AM to 5:30 PM IST. Kindly contact them during those hours. For any other queries, your AI counselor is available to help."
    : "Sorry for the inconvenience caused. All our counselors are currently unavailable. Kindly try again after some time. For any other queries, your AI counselor is available to help.";

  for (const item of pending) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.session.updateMany({
        where: { id: item.id, status: "PENDING_ESCALATION" },
        data: { status: "ACTIVE" },
      });
      if (claimed.count === 1) {
        await tx.message.create({
          data: { session_id: item.id, sender_type: "SYSTEM", content },
        });
      }
    });
  }
}
