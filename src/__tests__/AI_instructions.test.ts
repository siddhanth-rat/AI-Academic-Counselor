import { describe, it, expect } from "vitest";
import { getSystemInstructions } from "../lib/AI_instructions";

describe("getSystemInstructions", () => {
  it("should generate a system instruction prompt including the pre-loaded profile context", () => {
    const profileContext = "Registered profile: name=Alice, city=New York.";
    const instructions = getSystemInstructions(profileContext);

    // Verify it contains the profile context
    expect(instructions).toContain(profileContext);

    // Verify it contains the name of the assistant
    expect(instructions).toContain("AI Counselor");

    // Verify it defines the 15-Phase Admissions Roadmap
    expect(instructions).toContain("THE 15-PHASE ADMISSIONS ROADMAP");
    expect(instructions).toContain("PHASE_1_SELF_DISCOVERY");
    expect(instructions).toContain("PHASE_15_VISA");

    // Verify it specifies the refusal message for off-topic questions
    expect(instructions).toContain("REFUSAL RESPONSE");
    expect(instructions).toContain("I'm here specifically to help with study abroad admissions and visas");

    // Verify it contains rules for budget and loans
    expect(instructions).toContain("BUDGET & LOAN PLANNING RULES");
  });
});
