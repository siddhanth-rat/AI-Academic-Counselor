import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logSystemAction } from "@/lib/audit";
import { runWithRetry } from "@/lib/gemini";
import { verifyCsrf } from "@/lib/csrf";
import { sanitizeInput } from "@/lib/sanitize";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "Access Denied: CSRF validation failed." }, { status: 403 });
    }

    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await props.params;

    // Delete metrics and feedbacks first if they exist, then messages, then session
    await prisma.messageMetric.deleteMany({
      where: { message: { session_id: id } }
    });
    await prisma.messageFeedback.deleteMany({
      where: { message: { session_id: id } }
    });
    await prisma.message.deleteMany({ where: { session_id: id } });
    await prisma.session.delete({ where: { id } });

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";
    await logSystemAction({
      actorId: user.id,
      actionType: "DELETE_SESSION",
      targetEntity: id,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "Access Denied: CSRF validation failed." }, { status: 403 });
    }

    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await props.params;
    const body = await req.json();
    const { status, generateTitleFrom } = body;
    let title = body.title;

    if (generateTitleFrom) {
      const cleanGenerateTitleFrom = sanitizeInput(generateTitleFrom);
      try {
        const response = await runWithRetry((ai) =>
          ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: `Summarize this message into a short, descriptive chat title (2-5 words). Do not use quotes, punctuation, or any extra text. Message: "${cleanGenerateTitleFrom}"`,
          })
        );
        if (response.text) {
          title = response.text.trim().replace(/^["'](.*)["']$/, '$1');
        } else {
          title = cleanGenerateTitleFrom.slice(0, 25) + (cleanGenerateTitleFrom.length > 25 ? "..." : "");
        }
      } catch (e) {
        console.error("Failed to generate title", e);
        title = cleanGenerateTitleFrom.slice(0, 25) + (cleanGenerateTitleFrom.length > 25 ? "..." : "");
      }
    }

    const data: any = {};
    if (typeof title === "string" && title.trim()) {
      data.title = sanitizeInput(title);
    }
    if (status === "PENDING_ESCALATION" || status === "ACTIVE") {
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid update supplied" }, { status: 400 });
    }

    const updated = await prisma.session.update({ where: { id }, data });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
