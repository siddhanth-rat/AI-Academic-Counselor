// Touch to refresh TS server
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        student_profile: {
          include: {
            shortlisted_programs: {
              include: {
                program: {
                  include: {
                    institution: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dbUser?.student_profile) {
      return NextResponse.json({ shortlist: [] });
    }

    return NextResponse.json({
      success: true,
      shortlist: dbUser.student_profile.shortlisted_programs,
    });
  } catch (error: any) {
    console.error("Shortlist GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to load shortlist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { programId, status } = body;

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { student_profile: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Auto-create StudentProfile if missing
    let studentProfile = dbUser.student_profile;
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: { user_id: dbUser.id },
      });
    }

    const shortlist = await prisma.shortlistedProgram.upsert({
      where: {
        student_id_program_id: {
          student_id: studentProfile.user_id,
          program_id: programId,
        },
      },
      update: {
        status: status || "SHORTLISTED",
      },
      create: {
        student_id: studentProfile.user_id,
        program_id: programId,
        status: status || "SHORTLISTED",
      },
    });

    return NextResponse.json({ success: true, shortlist });
  } catch (error: any) {
    console.error("Shortlist POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to add to shortlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const programId = url.searchParams.get("programId");

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { student_profile: true },
    });

    if (!dbUser?.student_profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    await prisma.shortlistedProgram.delete({
      where: {
        student_id_program_id: {
          student_id: dbUser.student_profile.user_id,
          program_id: programId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Removed from shortlist" });
  } catch (error: any) {
    console.error("Shortlist DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete from shortlist" }, { status: 500 });
  }
}
