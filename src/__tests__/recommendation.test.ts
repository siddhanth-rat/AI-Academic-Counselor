import { vi, describe, it, expect, beforeEach } from "vitest";
import { getRecommendations } from "../lib/recommendation";
import { prisma } from "../lib/prisma";

// Mock prisma
vi.mock("../lib/prisma", () => {
  return {
    prisma: {
      institutionProgram: {
        findMany: vi.fn(),
      },
    },
  };
});

const mockPrisma = vi.mocked(prisma);

describe("getRecommendations", () => {
  const mockPrograms = [
    {
      id: "prog-1",
      program_name: "Master of Science in Computer Science",
      degree: "MS",
      duration_months: 24,
      tuition_fee: 50000,
      living_cost: 15000,
      application_fee: 100,
      intake: "Fall",
      deadline: new Date("2026-12-01"),
      min_gpa: 3.5,
      ielts_requirement: 7.0,
      toefl_requirement: 100,
      pte_requirement: 65,
      gre_required: true,
      gre_min: 310,
      gmat_required: false,
      work_exp_required: false,
      work_exp_years: null,
      scholarship_available: true,
      scholarship_amount: 10000,
      institution: {
        university_name: "Top Tier University",
        country: "USA",
        city: "Boston",
        qs_rank: 10,
        website: "https://toptier.edu",
      },
    },
    {
      id: "prog-2",
      program_name: "Master of Science in Information Technology",
      degree: "MS",
      duration_months: 18,
      tuition_fee: 30000,
      living_cost: 12000,
      application_fee: 50,
      intake: "Fall",
      deadline: new Date("2026-12-15"),
      min_gpa: 3.0,
      ielts_requirement: 6.5,
      toefl_requirement: 90,
      pte_requirement: 58,
      gre_required: false,
      gre_min: null,
      gmat_required: false,
      work_exp_required: false,
      work_exp_years: null,
      scholarship_available: false,
      scholarship_amount: null,
      institution: {
        university_name: "Mid Tier University",
        country: "Canada",
        city: "Toronto",
        qs_rank: 150,
        website: "https://midtier.edu",
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter by country and budget", async () => {
    mockPrisma.institutionProgram.findMany.mockResolvedValue(mockPrograms as any);

    const result = await getRecommendations({
      country: "USA",
      maxBudget: 60000,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("prog-1");
  });

  it("should respect the 10% budget overflow buffer", async () => {
    mockPrisma.institutionProgram.findMany.mockResolvedValue(mockPrograms as any);

    // Max budget 46000. prog-1 tuition is 50000. 46000 * 1.1 = 50600. So prog-1 should match.
    const result = await getRecommendations({
      maxBudget: 46000,
    });

    expect(result).toHaveLength(2);
  });

  it("should categorize GPA matches as Safe, Target, or Reach", async () => {
    mockPrisma.institutionProgram.findMany.mockResolvedValue(mockPrograms as any);

    // User GPA 4.0. Top Tier GPA requirement is 3.5. 4.0 >= 3.5 + 0.3.
    // However, top-tier ranking (QS 10) upgrades match category to Reach unless GPA is perfect,
    // wait: let's verify our recommendation logic on QS rank <= 15:
    // If rank <= 15 and gpa < 3.9, match_category = "Reach". If GPA is 4.0 (>= 3.9), it retains Safe/Target.
    // Let's test a student with GPA 4.0 at Top Tier (QS 10): should classify as Safe.
    const resultSafe = await getRecommendations({
      country: "USA",
      gpa: 4.0,
    });
    expect(resultSafe[0].match_category).toBe("Safe");

    // Student GPA 3.7. Top Tier min_gpa is 3.5. 3.7 is >= 3.5.
    // But since QS rank <= 15 and GPA is 3.7 (< 3.9), it gets upgraded to Reach.
    const resultReach = await getRecommendations({
      country: "USA",
      gpa: 3.7,
    });
    expect(resultReach[0].match_category).toBe("Reach");

    // Student GPA 3.3. Mid Tier min_gpa is 3.0. 3.3 is >= 3.0 + 0.3, so it should be Safe.
    const resultMidSafe = await getRecommendations({
      country: "Canada",
      gpa: 3.3,
    });
    expect(resultMidSafe[0].match_category).toBe("Safe");
  });

  it("should filter out programs where user scores are too low", async () => {
    mockPrisma.institutionProgram.findMany.mockResolvedValue(mockPrograms as any);

    // User IELTS is 6.0, which is below prog-1 requirement (7.0 - 0.5 = 6.5) and below prog-2 (6.5 - 0.5 = 6.0 but wait, IELTS threshold check:
    // if (ielts < ieltsReq - 0.5) continue.
    // For prog-1: ielts 6.0 < 7.0 - 0.5 (6.5), so skipped.
    // For prog-2: ielts 6.0 < 6.5 - 0.5 (6.0 is NOT < 6.0), so prog-2 is kept.
    const result = await getRecommendations({
      ielts: 6.0,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("prog-2");
  });
});
