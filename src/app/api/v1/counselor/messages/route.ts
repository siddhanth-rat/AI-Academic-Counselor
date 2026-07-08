import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyCsrf } from "@/lib/csrf";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "Access Denied: CSRF validation failed." }, { status: 403 });
    }

    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "COUNSELOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sessionId, content } = await req.json();
    if (!sessionId || !content) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const chatSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          where: { sender_type: "COUNSELOR" }
        }
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    // Track response time if this is the first counselor message in the session
    if (chatSession.messages.length === 0 && user) {
      const waitTimeSec = Math.floor((Date.now() - new Date(chatSession.updated_at).getTime()) / 1000);
      
      const perf = await prisma.counselorPerformance.findUnique({ where: { counselor_id: user.id } });
      const currentTotal = perf?.total_handled || 0;
      const currentAvg = perf?.avg_response_sec || 0;
      
      // Moving average calculation
      const newAvg = currentTotal === 0 ? waitTimeSec : Math.floor(((currentAvg * currentTotal) + waitTimeSec) / (currentTotal + 1));
      
      await prisma.counselorPerformance.upsert({
        where: { counselor_id: user.id },
        create: { counselor_id: user.id, avg_response_sec: newAvg },
        update: { avg_response_sec: newAvg }
      });
    }

    const [, msg] = await prisma.$transaction([
      prisma.notification.create({
        data: {
          user_id: chatSession.user_id,
          type: "COUNSELOR_MESSAGE",
          content: `${user?.name || "Your counselor"} sent you a new message.`,
        }
      }),
      prisma.message.create({
        data: {
          session_id: sessionId,
          sender_type: "COUNSELOR",
          content: sanitizeInput(content),
        }
      })
    ]);

    return NextResponse.json({ success: true, message: msg });
  } catch (error: any) {
    console.error("Counselor messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
