import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: 20
    });

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    
    // Mark specific notification as read, or all if no id provided
    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, user_id: user.id },
        data: { is_read: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { user_id: user.id, is_read: false },
        data: { is_read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
