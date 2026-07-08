import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { verifyCsrf } from "@/lib/csrf";
import { sanitizeInput, containsAbusiveLanguage } from "@/lib/sanitize";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "Access Denied: CSRF validation failed." }, { status: 403 });
    }

    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    if (containsAbusiveLanguage(content)) {
      return NextResponse.json({ error: "Message blocked: Please maintain a professional and respectful tone." }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        session_id: id,
        sender_type: "USER",
        content: sanitizeInput(content),
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Student message route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
