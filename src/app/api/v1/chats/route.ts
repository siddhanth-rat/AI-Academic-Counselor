import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveUnavailableEscalations } from "@/lib/escalation";
import { verifyCsrf } from "@/lib/csrf";
import { sanitizeInput } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  try {
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
    await resolveUnavailableEscalations();
    const sessions = await prisma.session.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      include: {
        counselor: { select: { name: true } },
        messages: { orderBy: { created_at: "asc" } },
      },
    });
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ sessions: [], info: "Database connection pending." });
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { title } = await req.json().catch(() => ({}));
    const cleanTitle = title ? sanitizeInput(title) : "New Chat";
    const newSession = await prisma.session.create({
      data: {
        title: cleanTitle,
        status: "ACTIVE",
        user_id: user.id,
      },
    });
    return NextResponse.json({ session: newSession });
  } catch (error: any) {
    return NextResponse.json({ error: "Unable to save to database" }, { status: 500 });
  }
}
