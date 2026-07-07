// Touch to refresh TS server
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Cleaning up old test data...");
  try {
    await prisma.dailyMetric.deleteMany({});
    await prisma.messageMetric.deleteMany({});
    await prisma.messageFeedback.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.shortlistedProgram.deleteMany({});
    await prisma.studentProfile.deleteMany({});
    await prisma.counselorPerformance.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditEvent.deleteMany({});
    await prisma.systemAuditLog.deleteMany({});
    await prisma.uploadedDocument.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.institutionProgram.deleteMany({});
    await prisma.institution.deleteMany({});
    console.log("✅ Database clean complete.");
  } catch (e) {
    console.warn("⚠️ Warning during database clean:", e);
  }

  console.log("🌱 Start seeding counselor and admin accounts...");

  // 1. Provision Admin Account
  const admin = await prisma.user.upsert({
    where: { email: "admin@consultancy.com" },
    update: {},
    create: {
      email: "admin@consultancy.com",
      password_hash: "admin123",
      name: "Admin Manager",
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin account provisioned: ${admin.email}`);

  // 2. Provision Counselor Account 1
  const counselor1 = await prisma.user.upsert({
    where: { email: "counselor@consultancy.com" },
    update: {},
    create: {
      email: "counselor@consultancy.com",
      password_hash: "counselor123",
      name: "Senior Counselor",
      role: Role.COUNSELOR,
    },
  });
  console.log(`✅ Counselor account 1 provisioned: ${counselor1.email}`);

  // 2b. Provision Student Account
  const student = await prisma.user.upsert({
    where: { email: "student@gmail.com" },
    update: {},
    create: {
      email: "student@gmail.com",
      password_hash: "student",
      name: "Jane Doe",
      role: Role.STUDENT,
      student_profile: {
        create: {
          current_phase: "PHASE_1_SELF_DISCOVERY",
          current_gpa: 9.99,
          target_country: "Singapore",
          preferred_degree: "MS",
          preferred_course: "Computer Science",
        }
      }
    },
  });
  console.log(`✅ Student account provisioned: ${student.email}`);

  // 3. Provision Institutions & Programs
  console.log("🌱 Seeding Institutions and Programs...");

  const institutionsData = [
    {
      university_name: "Massachusetts Institute of Technology (MIT)",
      country: "USA",
      city: "Cambridge",
      qs_rank: 1,
      website: "https://www.mit.edu",
      programs: [
        {
          program_name: "MS Computer Science",
          degree: "MS",
          duration_months: 24,
          tuition_fee: 55000,
          living_cost: 20000,
          application_fee: 75,
          intake: "Fall",
          deadline: new Date("2026-12-15"),
          min_gpa: 3.8,
          ielts_requirement: 7.5,
          toefl_requirement: 100,
          pte_requirement: 75,
          gre_required: true,
          gre_min: 320,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: true,
          scholarship_amount: 15000,
        },
        {
          program_name: "PhD Electrical Engineering",
          degree: "PhD",
          duration_months: 60,
          tuition_fee: 55000,
          living_cost: 20000,
          application_fee: 75,
          intake: "Fall",
          deadline: new Date("2026-12-15"),
          min_gpa: 3.9,
          ielts_requirement: 7.5,
          toefl_requirement: 100,
          pte_requirement: 75,
          gre_required: true,
          gre_min: 325,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: true,
          scholarship_amount: 55000,
        }
      ]
    },
    {
      university_name: "Harvard University",
      country: "USA",
      city: "Boston",
      qs_rank: 4,
      website: "https://www.harvard.edu",
      programs: [
        {
          program_name: "Master of Business Administration",
          degree: "MBA",
          duration_months: 24,
          tuition_fee: 75000,
          living_cost: 22000,
          application_fee: 250,
          intake: "Fall",
          deadline: new Date("2026-09-10"),
          min_gpa: 3.6,
          ielts_requirement: 7.5,
          toefl_requirement: 109,
          pte_requirement: 75,
          gre_required: false,
          gmat_required: true,
          work_exp_required: true,
          work_exp_years: 2.0,
          scholarship_available: true,
          scholarship_amount: 25000,
        }
      ]
    },
    {
      university_name: "University of Oxford",
      country: "UK",
      city: "Oxford",
      qs_rank: 3,
      website: "https://www.ox.ac.uk",
      programs: [
        {
          program_name: "MSc Computer Science",
          degree: "MS",
          duration_months: 12,
          tuition_fee: 38000,
          living_cost: 15000,
          application_fee: 100,
          intake: "Fall",
          deadline: new Date("2026-01-08"),
          min_gpa: 3.7,
          ielts_requirement: 7.5,
          toefl_requirement: 100,
          pte_requirement: 76,
          gre_required: false,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: true,
          scholarship_amount: 10000,
        }
      ]
    },
    {
      university_name: "University of Toronto",
      country: "Canada",
      city: "Toronto",
      qs_rank: 21,
      website: "https://www.utoronto.ca",
      programs: [
        {
          program_name: "MSc Computer Science",
          degree: "MS",
          duration_months: 24,
          tuition_fee: 42000,
          living_cost: 18000,
          application_fee: 120,
          intake: "Fall",
          deadline: new Date("2026-12-15"),
          min_gpa: 3.5,
          ielts_requirement: 7.0,
          toefl_requirement: 93,
          pte_requirement: 65,
          gre_required: false,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: true,
          scholarship_amount: 8000,
        }
      ]
    },
    {
      university_name: "Technical University of Munich (TUM)",
      country: "Germany",
      city: "Munich",
      qs_rank: 28,
      website: "https://www.tum.de",
      programs: [
        {
          program_name: "MSc Informatics",
          degree: "MS",
          duration_months: 24,
          tuition_fee: 0,
          living_cost: 12000,
          application_fee: 0,
          intake: "Winter",
          deadline: new Date("2026-05-31"),
          min_gpa: 3.0,
          ielts_requirement: 6.5,
          toefl_requirement: 88,
          pte_requirement: 60,
          gre_required: false,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: false,
        }
      ]
    },
    {
      university_name: "University of Melbourne",
      country: "Australia",
      city: "Melbourne",
      qs_rank: 13,
      website: "https://www.unimelb.edu.au",
      programs: [
        {
          program_name: "Master of Information Technology",
          degree: "MS",
          duration_months: 24,
          tuition_fee: 35000,
          living_cost: 16000,
          application_fee: 100,
          intake: "Spring",
          deadline: new Date("2026-10-31"),
          min_gpa: 3.2,
          ielts_requirement: 6.5,
          toefl_requirement: 79,
          pte_requirement: 58,
          gre_required: false,
          gmat_required: false,
          work_exp_required: false,
          scholarship_available: true,
          scholarship_amount: 5000,
        }
      ]
    }
  ];

  for (const instData of institutionsData) {
    const { programs, ...instFields } = instData;
    const inst = await prisma.institution.create({
      data: instFields,
    });
    console.log(`🏫 Created Institution: ${inst.university_name}`);

    for (const prog of programs) {
      await prisma.institutionProgram.create({
        data: {
          ...prog,
          institution_id: inst.id,
        },
      });
      console.log(`   🎓 Created Program: ${prog.program_name}`);
    }
  }

  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
