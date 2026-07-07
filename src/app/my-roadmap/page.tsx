"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

interface ShortlistedProgram {
  id: string;
  status: string;
  sop_completed: boolean;
  lor_completed: boolean;
  cv_completed: boolean;
  fee_paid: boolean;
  visa_filed: boolean;
}

interface StudentProfile {
  user_id: string;
  current_phase: string;
  current_gpa: any;
  current_degree: string | null;
  graduation_year: number | null;
  academic_board: string | null;
  ielts_score: any;
  toefl_score: number | null;
  pte_score: number | null;
  gre_score: number | null;
  gmat_score: number | null;
  preferred_course: string | null;
  preferred_degree: string | null;
  target_country: string | null;
  preferred_intake: string | null;
  budget_usd: number | null;
  scholarship_required: boolean;
  work_experience_years: any;
  research_experience: boolean;
  extracurriculars: string | null;
  volunteering: string | null;
  sports: string | null;
  projects_internships: string | null;
  sop_uploaded: boolean;
  resume_uploaded: boolean;
  passport_ready: boolean;
  visa_cas_i20_ready: boolean;
  visa_financials_ready: boolean;
  shortlisted_programs: ShortlistedProgram[];
}

interface PhaseItem {
  id: string;
  num: number;
  name: string;
  desc: string;
  icon: string;
  milestones: string[];
}

const PHASES: PhaseItem[] = [
  {
    id: "PHASE_1_SELF_DISCOVERY",
    num: 1,
    name: "Self Discovery",
    desc: "Define target countries, budget ranges, and major course interests.",
    icon: "🧭",
    milestones: ["Select target country", "Set preferred degree & major"]
  },
  {
    id: "PHASE_2_ACADEMIC_PLANNING",
    num: 2,
    name: "Academic Planning",
    desc: "Log academic board, GPA target, and graduation milestones.",
    icon: "📈",
    milestones: ["Provide current CGPA / GPA", "Verify graduation date"]
  },
  {
    id: "PHASE_3_PROFILE_BUILDING",
    num: 3,
    name: "Profile Building",
    desc: "Identify profile gaps, sports, achievements, and internships.",
    icon: "🏆",
    milestones: ["Log projects / internships", "Log extracurricular activities"]
  },
  {
    id: "PHASE_4_STANDARDIZED_TESTS",
    num: 4,
    name: "Standardized Tests",
    desc: "Assess language test scores (IELTS/TOEFL/PTE) or GRE/GMAT deadlines.",
    icon: "📝",
    milestones: ["Prepare test timelines", "Enter english / aptitude test scores"]
  },
  {
    id: "PHASE_5_UNIVERSITY_DISCOVERY",
    num: 5,
    name: "University Discovery",
    desc: "Explore Safe, Target, and Reach universities in your course.",
    icon: "🏫",
    milestones: ["Verify requirements match", "Add initial programs to shortlist"]
  },
  {
    id: "PHASE_6_SHORTLISTING",
    num: 6,
    name: "Shortlisting",
    desc: "Narrow down university list to final set of targets.",
    icon: "🎯",
    milestones: ["Refine university list to applying status"]
  },
  {
    id: "PHASE_7_REQUIREMENTS_CHECK",
    num: 7,
    name: "Requirements Check",
    desc: "Compare checklist items and score cutoffs for targets.",
    icon: "📋",
    milestones: ["Review cutoffs", "Review SOP/LOR prompt counts"]
  },
  {
    id: "PHASE_8_DOCUMENT_PREPARATION",
    num: 8,
    name: "Document Prep",
    desc: "Prepare, write, and review SOPs, resumes, and recommendation letters.",
    icon: "📄",
    milestones: ["Upload draft Statement of Purpose", "Upload draft Resume"]
  },
  {
    id: "PHASE_9_APPLICATION_MANAGEMENT",
    num: 9,
    name: "Application Submission",
    desc: "Submit application portals and log fee receipts.",
    icon: "📨",
    milestones: ["Submit applications to target universities", "Track portal login details"]
  },
  {
    id: "PHASE_10_DEADLINE_MANAGEMENT",
    num: 10,
    name: "Deadline Management",
    desc: "Track application dates, rounds, and submission countdowns.",
    icon: "📅",
    milestones: ["Track intake deadline cycles"]
  },
  {
    id: "PHASE_11_SCHOLARSHIP_SEARCH",
    num: 11,
    name: "Scholarship Search",
    desc: "Audit merit-based scholarships and government aid windows.",
    icon: "💰",
    milestones: ["Identify scholarship applications"]
  },
  {
    id: "PHASE_12_FINANCIAL_PLANNING",
    num: 12,
    name: "Financial Planning",
    desc: "Estimate total fees, costs of living, and secured loan requirements.",
    icon: "💸",
    milestones: ["Assess bank loan requirements", "Calculate aggregate expenses"]
  },
  {
    id: "PHASE_13_INTERVIEW_PREPARATION",
    num: 13,
    name: "Admissions Interview",
    desc: "Prepare mock responses for university panels.",
    icon: "🤝",
    milestones: ["Conduct university mock interview calls"]
  },
  {
    id: "PHASE_14_OFFER_MANAGEMENT",
    num: 14,
    name: "Offer Selection",
    desc: "Evaluate and choose between offer letters and packages.",
    icon: "🥇",
    milestones: ["Accept admission offer letter"]
  },
  {
    id: "PHASE_15_VISA",
    num: 15,
    name: "Student Visa",
    desc: "Organize CAS/I-20, financials, biometrics, and interview.",
    icon: "🛂",
    milestones: ["Secure CAS/I-20 visa documents", "Obtain proof of funding"]
  }
];

export default function StudentRoadmapPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/v1/user/student-profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.studentProfile);
        }
      } catch (e) {
        console.error("Failed to load student profile", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const isPhaseCompleted = (phaseId: string, currentPhase: string): boolean => {
    if (!profile) return false;
    
    const phases = PHASES.map(p => p.id);
    const currentIdx = phases.indexOf(currentPhase);
    const thisIdx = phases.indexOf(phaseId);
    
    // Rule 1: If the student has already progressed PAST this phase, it is completed.
    if (thisIdx < currentIdx) return true;
    
    // Rule 2: Custom database-driven completion rules
    switch (phaseId) {
      case "PHASE_1_SELF_DISCOVERY":
        return !!(profile.preferred_course || profile.target_country);
      case "PHASE_2_ACADEMIC_PLANNING":
        return !!profile.current_gpa;
      case "PHASE_3_PROFILE_BUILDING":
        return !!(profile.volunteering || profile.sports || profile.projects_internships);
      case "PHASE_4_STANDARDIZED_TESTS":
        return !!(profile.ielts_score || profile.toefl_score || profile.pte_score || profile.gre_score || profile.gmat_score);
      case "PHASE_5_UNIVERSITY_DISCOVERY":
        return !!(profile.shortlisted_programs && profile.shortlisted_programs.length > 0);
      case "PHASE_6_SHORTLISTING":
        return !!(profile.shortlisted_programs && profile.shortlisted_programs.some(p => p.status !== "INTERESTED"));
      case "PHASE_8_DOCUMENT_PREPARATION":
        return !!(profile.sop_uploaded && profile.resume_uploaded);
      case "PHASE_9_APPLICATION_MANAGEMENT":
        return !!(profile.shortlisted_programs && profile.shortlisted_programs.some(p => p.fee_paid || p.status === "APPLIED"));
      case "PHASE_12_FINANCIAL_PLANNING":
        return !!(profile.budget_usd || profile.scholarship_required);
      case "PHASE_15_VISA":
        return !!(profile.passport_ready && (profile.visa_cas_i20_ready || profile.visa_financials_ready));
      default:
        return false;
    }
  };

  const getPhaseStatus = (phaseId: string): "COMPLETED" | "IN_PROGRESS" | "TODO" => {
    if (!profile) return "TODO";
    const currentPhase = profile.current_phase;
    
    if (isPhaseCompleted(phaseId, currentPhase)) {
      return "COMPLETED";
    }
    
    if (phaseId === currentPhase) {
      return "IN_PROGRESS";
    }
    
    return "TODO";
  };

  // Group phases
  const completedPhases = PHASES.filter(p => getPhaseStatus(p.id) === "COMPLETED");
  const inProgressPhases = PHASES.filter(p => getPhaseStatus(p.id) === "IN_PROGRESS");
  const todoPhases = PHASES.filter(p => getPhaseStatus(p.id) === "TODO");

  const progressPercentage = Math.round((completedPhases.length / PHASES.length) * 100);

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED] dark:bg-[#121212] overflow-hidden">
      {/* Top Header */}
      <header className="h-[60px] min-h-[60px] flex items-center justify-between px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#066AC9] transition-colors">
            ← Chatbot
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-semibold text-[#1F2022] dark:text-[#E0E0E0]">
            Admissions Roadmap
          </h1>
        </div>
        <ProfileMenu showPortalLink={true} />
      </header>

      {/* Main Roadmap Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
          
          {/* Progress Dashboard Banner */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row gap-6 justify-between items-center shadow-sm shrink-0">
            <div className="flex-1 w-full">
              <h2 className="text-lg font-bold text-[#1F2022] dark:text-white">Your Admissions Funnel</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete chat milestones to unlock steps, upload documents, and progress towards your visa.</p>
              
              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Admissions Progress</span>
                  <span>{progressPercentage}% Completed</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div style={{ width: `${progressPercentage}%` }} className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" />
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex gap-4 text-center bg-gray-50 dark:bg-[#2C2C2C]/30 px-6 py-4 rounded-xl border border-gray-100 dark:border-gray-850 shadow-inner w-full md:w-auto justify-around">
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Completed</div>
                <div className="text-2xl font-extrabold text-emerald-500 mt-1">{completedPhases.length}</div>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-800 self-stretch" />
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">In Progress</div>
                <div className="text-2xl font-extrabold text-blue-500 mt-1">{inProgressPhases.length}</div>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-800 self-stretch" />
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">To Do</div>
                <div className="text-2xl font-extrabold text-gray-400 mt-1">{todoPhases.length}</div>
              </div>
            </div>
          </div>

          {/* Kanban Board Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start overflow-hidden min-h-[500px]">
            {/* Column 1: Completed */}
            <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/10 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/30 overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  ✅ Completed ({completedPhases.length})
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="h-20 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-150 animate-pulse" />
                ) : completedPhases.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-8 font-medium italic">No phases completed yet.</p>
                ) : (
                  completedPhases.map((phase) => (
                    <div 
                      key={phase.id} 
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-900/30 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 group-hover:scale-105 transition-transform duration-300">{phase.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Phase {phase.num}</span>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">{phase.name}</h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">{phase.desc}</p>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Completed Milestones:</span>
                            <ul className="mt-1 space-y-1">
                              {phase.milestones.map((m, i) => (
                                <li key={i} className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <span className="text-emerald-500">✓</span> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/10 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/30 overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  🔥 Active Target ({inProgressPhases.length})
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="h-20 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-150 animate-pulse" />
                ) : inProgressPhases.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-8 font-medium italic">No active phases. Explore chatbot to activate next steps.</p>
                ) : (
                  inProgressPhases.map((phase) => (
                    <div 
                      key={phase.id} 
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border-2 border-blue-500/50 dark:border-blue-900/60 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 group-hover:scale-105 transition-transform duration-300">{phase.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            Phase {phase.num}
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                          </span>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white mt-0.5">{phase.name}</h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{phase.desc}</p>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Required Actions:</span>
                            <ul className="mt-1 space-y-1">
                              {phase.milestones.map((m, i) => (
                                <li key={i} className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: To Do */}
            <div className="flex flex-col h-full bg-gray-50/50 dark:bg-black/10 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/30 overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  ⏳ Upcoming ({todoPhases.length})
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="h-20 bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-150 animate-pulse" />
                ) : todoPhases.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-8 font-medium italic">All funnel phases completed! 🎓</p>
                ) : (
                  todoPhases.map((phase) => (
                    <div 
                      key={phase.id} 
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-gray-850 shadow-sm opacity-60 hover:opacity-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 group-hover:scale-105 transition-transform duration-300">{phase.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Phase {phase.num}</span>
                          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">{phase.name}</h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-snug">{phase.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
