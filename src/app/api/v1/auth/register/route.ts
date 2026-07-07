import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, countryOfOrigin, role } = await req.json();

    if (!email || !password || !name?.trim()) {
      return NextResponse.json({ error: "Full name, email, and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
    }

    // Create user in Supabase via Prisma matching exact schema relations
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: password, // In production, hash with bcrypt
        name: name.trim(),
        role: role || "STUDENT",
        student_profile: role === "STUDENT" ? {
          create: {
            target_country: countryOfOrigin || "India",
            current_gpa: 3.5,
            budget_usd: 40000,
          }
        } : undefined
      },
      include: { student_profile: true }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Failed to create account in database." }, { status: 500 });
  }
}
