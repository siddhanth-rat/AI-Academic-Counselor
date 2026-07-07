import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AppRole = "STUDENT" | "COUNSELOR" | "ADMIN";

function sessionRole(user: unknown): AppRole {
  const role = (user as { role?: AppRole } | undefined)?.role;
  return role === "COUNSELOR" || role === "ADMIN" ? role : "STUDENT";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { email: true, name: true, role: true, city: true, state: true, date_of_birth: true },
    });

    if (!user) {
      return NextResponse.json({
        profile: {
          email: session.user.email,
          name: session.user.name || "",
          role: sessionRole(session.user),
          city: "",
          state: "",
          dateOfBirth: "",
        },
      });
    }

    return NextResponse.json({
      profile: { ...user, dateOfBirth: user.date_of_birth?.toISOString().slice(0, 10) || "" },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Full name is required" }, { status: 400 });

    const dateOfBirth = body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00.000Z`) : null;
    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }

    const profileData = {
      name,
      city: String(body.city || "").trim() || null,
      state: String(body.state || "").trim() || null,
      date_of_birth: dateOfBirth,
    };

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: profileData,
      create: {
        email: session.user.email,
        role: sessionRole(session.user),
        ...profileData,
      },
      select: { email: true, name: true, role: true, city: true, state: true, date_of_birth: true },
    });

    return NextResponse.json({
      success: true,
      profile: { ...user, dateOfBirth: user.date_of_birth?.toISOString().slice(0, 10) || "" },
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
