import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "Access Denied: CSRF validation failed." }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, rating } = await req.json();
    if (!sessionId || typeof rating !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const chatSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (chatSession.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized to rate this session" }, { status: 403 });
    }

    if (chatSession.counselor_id) {
      const perf = await prisma.counselorPerformance.findUnique({
        where: { counselor_id: chatSession.counselor_id }
      });
      
      const currentScore = perf?.satisfaction_score ? parseFloat(perf.satisfaction_score.toString()) : rating;
      const currentTotal = perf?.total_handled || 1;
      
      // Moving average for 5-star scale
      // new_avg = ((old_avg * (total - 1)) + new_rating) / total
      // We assume total_handled was already incremented by the leave action
      const n = Math.max(1, currentTotal);
      const newScore = ((currentScore * (n - 1)) + rating) / n;
      
      await prisma.counselorPerformance.update({
        where: { counselor_id: chatSession.counselor_id },
        data: { satisfaction_score: newScore }
      });
    }

    // Mark the session as ACTIVE so the student can chat again, and clear counselor_id
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", counselor_id: null }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Counselor rating error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
