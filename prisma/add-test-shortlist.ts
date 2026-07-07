import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "student@gmail.com" },
    include: { student_profile: true }
  });

  if (!user || !user.student_profile) {
    console.error("Student profile not found. Please log in as student@gmail.com first.");
    return;
  }

  const program = await prisma.institutionProgram.findFirst({
    include: { institution: true }
  });

  if (!program) {
    console.error("No programs found in the database.");
    return;
  }

  const shortlist = await prisma.shortlistedProgram.upsert({
    where: {
      student_id_program_id: {
        student_id: user.student_profile.user_id,
        program_id: program.id
      }
    },
    update: {
      status: "INTERESTED"
    },
    create: {
      student_id: user.student_profile.user_id,
      program_id: program.id,
      status: "INTERESTED"
    }
  });

  console.log(`\n✅ Program successfully shortlisted: "${program.program_name}" at ${program.institution.university_name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
