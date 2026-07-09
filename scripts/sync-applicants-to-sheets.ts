import { PrismaClient } from "@prisma/client";
import { syncAllApplicantsToSheets } from "../src/app/actions/recruitment";

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("   LOFT - Google Sheets Sync Utility      ");
  console.log("==========================================");

  console.log("Starting bulk sync to Google Sheets...");

  try {
    const res = await syncAllApplicantsToSheets();
    if ("error" in res && res.error) {
      console.log(`\x1b[31mFAILED\x1b[0m (${res.error})`);
    } else if ("successCount" in res) {
      console.log(`\x1b[32mSUCCESS\x1b[0m. Synced ${res.successCount} applicants.`);
    }
  } catch (e: any) {
    console.log(`\x1b[31mERROR\x1b[0m (${e.message})`);
  }

  console.log("------------------------------------------");
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
