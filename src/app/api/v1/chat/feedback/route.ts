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
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, rating, feedbackReason } = body;

    if (!messageId || typeof rating !== "number") {
      return NextResponse.json({ error: "Missing messageId or rating" }, { status: 400 });
    }

    // Verify the message belongs to a session owned by this user
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { session: true }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (message.session.user_id !== user?.id) {
      return NextResponse.json({ error: "Unauthorized to rate this message" }, { status: 403 });
    }

    // Upsert feedback
    const feedback = await prisma.messageFeedback.upsert({
      where: { message_id: messageId },
      create: {
        message_id: messageId,
        rating,
        feedback_reason: feedbackReason ? sanitizeInput(feedbackReason) : null,
      },
      update: {
        rating,
        feedback_reason: feedbackReason ? sanitizeInput(feedbackReason) : null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
