// Touch to refresh TS server
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/lib/recommendation";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let profileCriteria: any = {};

    // 1. Fetch authenticated student profile details if available
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { student_profile: true },
      });

      if (dbUser?.student_profile) {
        const p = dbUser.student_profile;
        profileCriteria = {
          country: p.target_country || undefined,
          maxBudget: p.budget_usd || undefined,
          degree: p.preferred_degree || undefined,
          course: p.preferred_course || undefined,
          gpa: p.current_gpa ? Number(p.current_gpa) : undefined,
          ielts: p.ielts_score ? Number(p.ielts_score) : undefined,
          toefl: p.toefl_score || undefined,
          pte: p.pte_score || undefined,
          gre: p.gre_score || undefined,
          gmat: p.gmat_score || undefined,
          workExperience: p.work_experience_years ? Number(p.work_experience_years) : undefined,
        };
      }
    }

    // 2. Parse overrides from URL Query Parameters
    const url = new URL(req.url);
    const country = url.searchParams.get("country") || profileCriteria.country;
    const maxBudgetStr = url.searchParams.get("budget") || url.searchParams.get("maxBudget");
    const maxBudget = maxBudgetStr ? parseInt(maxBudgetStr, 10) : profileCriteria.maxBudget;
    const degree = url.searchParams.get("degree") || profileCriteria.degree;
    const course = url.searchParams.get("course") || profileCriteria.course;
    
    const gpaStr = url.searchParams.get("gpa");
    const gpa = gpaStr ? parseFloat(gpaStr) : profileCriteria.gpa;

    const ieltsStr = url.searchParams.get("ielts");
    const ielts = ieltsStr ? parseFloat(ieltsStr) : profileCriteria.ielts;

    const toeflStr = url.searchParams.get("toefl");
    const toefl = toeflStr ? parseInt(toeflStr, 10) : profileCriteria.toefl;

    const pteStr = url.searchParams.get("pte");
    const pte = pteStr ? parseInt(pteStr, 10) : profileCriteria.pte;

    const greStr = url.searchParams.get("gre");
    const gre = greStr ? parseInt(greStr, 10) : profileCriteria.gre;

    const gmatStr = url.searchParams.get("gmat");
    const gmat = gmatStr ? parseInt(gmatStr, 10) : profileCriteria.gmat;

    const workExpStr = url.searchParams.get("workExperience") || url.searchParams.get("workExp");
    const workExperience = workExpStr ? parseFloat(workExpStr) : profileCriteria.workExperience;

    // 3. Trigger matching engine
    const recommendations = await getRecommendations({
      country,
      maxBudget,
      degree,
      course,
      gpa,
      ielts,
      toefl,
      pte,
      gre,
      gmat,
      workExperience,
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load recommendations" }, { status: 500 });
  }
}
