import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // In production, fetch userId from auth session
    const sessions = await prisma.chatSession.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { messages: true },
    });
    return NextResponse.json({ sessions });
  } catch (error: any) {
    // Fallback if DB is not reachable in local sandbox
    return NextResponse.json({ sessions: [], info: "Database connection pending." });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const session = await prisma.chatSession.create({
      data: {
        title: title || "New Chat",
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: "Unable to save to database" }, { status: 500 });
  }
}
