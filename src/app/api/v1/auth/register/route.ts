import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, countryOfOrigin, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
    }

    // Create user in Supabase via Prisma
    const user = await prisma.user.create({
      data: {
        email,
        name: name || "Student",
        role: role || "STUDENT",
        profile: role === "STUDENT" ? {
          create: {
            countryOfOrigin: countryOfOrigin || "India",
            currentGpa: 3.5,
            budgetUsd: 40000,
          }
        } : undefined
      },
      include: { profile: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Failed to create account in database." }, { status: 500 });
  }
}
