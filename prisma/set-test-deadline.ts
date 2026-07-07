import { prisma } from "../src/lib/prisma";

async function main() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);

  const updated = await prisma.institutionProgram.updateMany({
    data: {
      deadline: targetDate
    }
  });

  console.log(`\n✅ Updated ${updated.count} programs with a test deadline set to: ${targetDate.toDateString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
