import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveUnavailableEscalations } from "@/lib/escalation";
import { logSystemAction } from "@/lib/audit";
import { verifyCsrf } from "@/lib/csrf";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "COUNSELOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await resolveUnavailableEscalations();

    const escalations = await prisma.session.findMany({
      where: {
        status: {
          in: ["PENDING_ESCALATION", "ESCALATED_ACTIVE"]
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        },
        counselor: {
          select: {
            email: true,
            name: true,
          }
        },
        messages: {
          orderBy: { created_at: "asc" }
        }
      },
      orderBy: { updated_at: "desc" }
    });

    const formatted = escalations.map((esc) => {
      const waitTimeMs = Date.now() - new Date(esc.updated_at).getTime();
      const waitMins = Math.floor(waitTimeMs / 60000);
      return {
        id: esc.id,
        user: esc.user.name || esc.user.email,
        topic: esc.title,
        status: esc.status === "PENDING_ESCALATION" ? "PENDING" : "ACTIVE",
        waitTime: `${waitMins}m`,
        counselor: esc.counselor?.name || "Counselor",
        messages: esc.messages.map((m) => ({
          role: m.sender_type === "USER" ? "user" : m.sender_type === "COUNSELOR" ? "counselor" : m.sender_type === "SYSTEM" ? "system" : "model",
          content: m.content,
          senderName: m.sender_type === "USER" ? esc.user.name || "Student" : m.sender_type === "COUNSELOR" ? esc.counselor?.name || "Counselor" : undefined,
        }))
      };
    });

    return NextResponse.json({ escalations: formatted });
  } catch (error: any) {
    console.error("Escalations GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { sessionId, action } = await req.json();

    const sessionToUpdate = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!sessionToUpdate) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (action === "takeover") {
      const counselorName = user.name || "your counselor";
      const [, updated] = await prisma.$transaction([
        prisma.message.create({
          data: {
            session_id: sessionId,
            sender_type: "SYSTEM",
            content: `You are now connected with ${counselorName}. Kindly maintain respectful and appropriate communication throughout the conversation.`,
          },
        }),
        prisma.session.update({
          where: { id: sessionId },
          data: { status: "ESCALATED_ACTIVE", counselor_id: user.id },
        }),
        prisma.notification.create({
          data: {
            user_id: sessionToUpdate.user_id,
            type: "COUNSELOR_TAKEOVER",
            content: `${counselorName} has connected to your chat session!`,
          }
        })
      ]);

      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
      await logSystemAction({
        actorId: user.id,
        actionType: "TAKEOVER_SESSION",
        targetEntity: sessionId,
        ipAddress,
      });

      return NextResponse.json({ success: true, session: updated });
    } else if (action === "leave") {
      const counselorName = user.name || "your counselor";
      const [, updated] = await prisma.$transaction([
        prisma.message.create({
          data: {
            session_id: sessionId,
            sender_type: "SYSTEM",
            content: `Your conversation with ${counselorName} has ended. You are now reconnected with the AI counselor.`,
          },
        }),
        prisma.session.update({
          where: { id: sessionId },
          data: { status: "CLOSED" }, // Keep counselor_id so we know who to rate
        }),
        prisma.counselorPerformance.upsert({
          where: { counselor_id: user.id },
          create: { counselor_id: user.id, total_handled: 1 },
          update: { total_handled: { increment: 1 } }
        }),
      ]);

      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
      await logSystemAction({
        actorId: user.id,
        actionType: "LEAVE_SESSION",
        targetEntity: sessionId,
        ipAddress,
      });

      return NextResponse.json({ success: true, session: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Escalations POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
