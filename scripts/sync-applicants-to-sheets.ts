import { PrismaClient } from "@prisma/client";
import { syncApplicantToSheets } from "../src/app/actions/recruitment";

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("   LOFT - Google Sheets Sync Utility      ");
  console.log("==========================================");

  // Fetch all applicants sorted by creation date ascending (so they are appended in order)
  const applicants = await prisma.recruitmentApplicant.findMany({
    select: { applicantId: true, fullName: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${applicants.length} applicants in database.`);
  console.log("Starting sync...");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < applicants.length; i++) {
    const applicant = applicants[i];
    process.stdout.write(`[${i + 1}/${applicants.length}] Syncing ${applicant.applicantId} (${applicant.fullName})... `);
    try {
      const res = await syncApplicantToSheets(applicant.applicantId);
      if (res.success) {
        console.log("\x1b[32mSUCCESS\x1b[0m");
        successCount++;
      } else {
        console.log(`\x1b[31mFAILED\x1b[0m (${res.error})`);
        failCount++;
      }
    } catch (e: any) {
      console.log(`\x1b[31mERROR\x1b[0m (${e.message})`);
      failCount++;
    }
  }

  console.log("------------------------------------------");
  console.log(`Sync completed! Success: ${successCount}, Failed: ${failCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
