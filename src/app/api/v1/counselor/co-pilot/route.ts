import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyCsrf } from "@/lib/csrf";
import { runWithRetry } from "@/lib/gemini";

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

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Invalid parameters: sessionId required" }, { status: 400 });
    }

    const chatSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { created_at: "asc" }
        }
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Filter messages and format for Gemini contents payload
    const contents = chatSession.messages
      .filter((m) => m.sender_type === "USER" || m.sender_type === "AI" || m.sender_type === "COUNSELOR")
      .map((m) => ({
        role: m.sender_type === "USER" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

    if (contents.length === 0) {
      return NextResponse.json({ draft: "No chat history available to analyze." });
    }

    const systemInstruction = 
      "You are an AI assistant co-pilot for a professional study-abroad admissions counselor. " +
      "Review the student's questions and the chat history. " +
      "Generate a helpful, precise, and professional response draft for the counselor to review and send to the student. " +
      "Do NOT include any meta-text, introductions (like 'Here is a draft:', or 'Dear Student'), or quotes around the draft. " +
      "Output ONLY the raw content of the message you want the counselor to send. " +
      "Be concise and directly address the student's latest questions.";

    const response = await runWithRetry((ai) =>
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction
        }
      })
    );

    const draftText = response.text?.trim() || "Could not generate draft suggestions.";

    return NextResponse.json({ success: true, draft: draftText });
  } catch (error: any) {
    console.error("Counselor co-pilot error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
