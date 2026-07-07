// Touch to refresh TS server
import { prisma } from "./prisma";

export interface RecommendationCriteria {
  country?: string;
  maxBudget?: number;
  degree?: string;
  course?: string;
  gpa?: number;
  ielts?: number;
  toefl?: number;
  pte?: number;
  gre?: number;
  gmat?: number;
  workExperience?: number;
}

export interface RecommendedProgram {
  id: string;
  university_name: string;
  program_name: string;
  degree: string;
  country: string;
  city: string | null;
  duration_months: number;
  tuition_fee: number;
  living_cost: number | null;
  application_fee: number | null;
  intake: string;
  deadline: string | null;
  min_gpa: number | null;
  ielts_requirement: number | null;
  toefl_requirement: number | null;
  pte_requirement: number | null;
  gre_required: boolean;
  gre_min: number | null;
  gmat_required: boolean;
  work_exp_required: boolean;
  work_exp_years: number | null;
  scholarship_available: boolean;
  scholarship_amount: number | null;
  qs_rank: number | null;
  website: string | null;
  match_category: "Safe" | "Target" | "Reach";
}

export async function getRecommendations(criteria: RecommendationCriteria): Promise<RecommendedProgram[]> {
  const {
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
  } = criteria;

  // 1. Fetch all programs with their parent institution details
  const programs = await prisma.institutionProgram.findMany({
    include: {
      institution: true,
    },
  });

  const matched: RecommendedProgram[] = [];

  for (const prog of programs) {
    const inst = prog.institution;

    // Filter: Country preference (if student specified and it doesn't match)
    if (country && country.trim().toLowerCase() !== "any" && country.trim().toLowerCase() !== "compare all") {
      if (inst.country.toLowerCase() !== country.toLowerCase()) {
        continue;
      }
    }

    // Filter: Budget constraints (allow 10% overflow buffer to keep it helpful)
    if (maxBudget && maxBudget > 0) {
      if (prog.tuition_fee > maxBudget * 1.1) {
        continue;
      }
    }

    // Filter: Degree match (MS vs MBA vs Bachelors)
    if (degree && degree.trim()) {
      const d = degree.toLowerCase();
      const pd = prog.degree.toLowerCase();
      // Match general degree types
      if (d.includes("master") || d === "ms" || d === "msc") {
        if (!pd.includes("ms") && !pd.includes("master") && !pd.includes("msc") && !pd.includes("mba")) {
          continue;
        }
      } else if (d.includes("bachelor") || d === "bs" || d === "bsc" || d === "ba") {
        if (!pd.includes("bs") && !pd.includes("bachelor") && !pd.includes("bsc") && !pd.includes("ba")) {
          continue;
        }
      } else if (d.includes("phd") || d === "doctoral") {
        if (!pd.includes("phd") && !pd.includes("doctor")) {
          continue;
        }
      }
    }

    // Filter: Course keywords (e.g. computer science, business)
    if (course && course.trim()) {
      const keywords = course.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      if (keywords.length > 0) {
        const fullText = `${prog.program_name} ${prog.degree} ${inst.university_name}`.toLowerCase();
        const matchesKeyword = keywords.some(kw => fullText.includes(kw));
        if (!matchesKeyword) {
          continue; // Skip if no keywords match
        }
      }
    }

    // 2. Classify: reach / target / safe based on GPA & test requirements
    let matchCategory: "Safe" | "Target" | "Reach" = "Target";

    const minGpaVal = prog.min_gpa ? Number(prog.min_gpa) : null;
    const ieltsReq = prog.ielts_requirement ? Number(prog.ielts_requirement) : null;
    const greMin = prog.gre_min ? Number(prog.gre_min) : null;

    if (gpa) {
      if (minGpaVal) {
        if (gpa < minGpaVal - 0.3) {
          // GPA is significantly below minimum requirement
          continue; 
        } else if (gpa < minGpaVal) {
          matchCategory = "Reach"; // GPA is close but slightly below
        } else if (gpa >= minGpaVal + 0.3) {
          matchCategory = "Safe";
        }
      }
    }

    if (ielts && ieltsReq) {
      if (ielts < ieltsReq - 0.5) {
        continue; // Too low for IELTS
      } else if (ielts < ieltsReq) {
        matchCategory = "Reach";
      }
    }

    if (gre && greMin && prog.gre_required) {
      if (gre < greMin - 15) {
        continue; // GRE is too low
      } else if (gre < greMin) {
        matchCategory = "Reach";
      }
    }

    // Work experience checks
    if (prog.work_exp_required && prog.work_exp_years) {
      const expYears = Number(prog.work_exp_years);
      if (!workExperience || workExperience < expYears) {
        // Skip or mark as Reach if they have almost enough experience
        if (workExperience && workExperience >= expYears - 1) {
          matchCategory = "Reach";
        } else {
          continue;
        }
      }
    }

    // If university ranking is ultra competitive (QS < 15), upgrade to "Reach" unless GPA is perfect
    if (inst.qs_rank && inst.qs_rank <= 15) {
      if (gpa && gpa < 3.9) {
        matchCategory = "Reach";
      }
    }

    matched.push({
      id: prog.id,
      university_name: inst.university_name,
      program_name: prog.program_name,
      degree: prog.degree,
      country: inst.country,
      city: inst.city,
      duration_months: prog.duration_months,
      tuition_fee: prog.tuition_fee,
      living_cost: prog.living_cost,
      application_fee: prog.application_fee,
      intake: prog.intake,
      deadline: prog.deadline ? prog.deadline.toISOString().slice(0, 10) : null,
      min_gpa: minGpaVal,
      ielts_requirement: ieltsReq,
      toefl_requirement: prog.toefl_requirement,
      pte_requirement: prog.pte_requirement,
      gre_required: prog.gre_required,
      gre_min: greMin,
      gmat_required: prog.gmat_required,
      work_exp_required: prog.work_exp_required,
      work_exp_years: prog.work_exp_years ? Number(prog.work_exp_years) : null,
      scholarship_available: prog.scholarship_available,
      scholarship_amount: prog.scholarship_amount,
      qs_rank: inst.qs_rank,
      website: inst.website,
      match_category: matchCategory,
    });
  }

  // Sort: Safe first, then Target, then Reach. Within categories, sort by QS Rank ascending (better rank first)
  const categoryPriority = { Safe: 1, Target: 2, Reach: 3 };
  return matched.sort((a, b) => {
    const catDiff = categoryPriority[a.match_category] - categoryPriority[b.match_category];
    if (catDiff !== 0) return catDiff;
    const rankA = a.qs_rank ?? 9999;
    const rankB = b.qs_rank ?? 9999;
    return rankA - rankB;
  });
}
