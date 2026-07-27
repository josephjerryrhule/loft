import { PrismaClient } from '@prisma/client';
import { sendVenueConfirmationEmail } from '../src/lib/email';
import { format } from 'date-fns';

const prisma = new PrismaClient();

async function runCampaign() {
  const isTest = process.argv.includes('--test') || process.argv.some(arg => arg.startsWith('--test-email='));
  const testEmailArg = process.argv.find(arg => arg.startsWith('--test-email='))?.split('=')[1] || 'joseph@effectstudios.co';

  console.log("=================================================");
  console.log("📍 LOFT VENUE CONFIRMATION EMAIL CAMPAIGN");
  console.log("=================================================");
  console.log(`Mode: ${isTest ? `TEST MODE (Targeting: ${testEmailArg})` : 'PRODUCTION MODE (Sending to ALL booked applicants)'}`);

  // Fetch all applicants with a confirmed audition booking
  const bookedApplicants = await prisma.recruitmentApplicant.findMany({
    where: {
      OR: [
        { auditionSessionId: { not: null } },
        { status: { in: ["AUDITION_SLOT_BOOKED", "AUDITION_CONFIRMED", "AUDITION_ATTENDED"] } }
      ]
    },
    include: {
      auditionSession: {
        include: {
          event: true
        }
      }
    }
  });

  console.log(`\nFound ${bookedApplicants.length} applicant(s) with confirmed audition bookings.`);

  if (bookedApplicants.length === 0) {
    console.log("No booked applicants found. Exiting.");
    return;
  }

  if (isTest) {
    console.log(`\n--- RUNNING TEST EMAIL SEND TO ${testEmailArg} ---`);
    const sampleApplicant = bookedApplicants[0];
    const session = sampleApplicant.auditionSession;

    if (!session || !session.event) {
      console.error("Error: Sample applicant does not have a valid audition session attached.");
      return;
    }

    const firstName = sampleApplicant.fullName.trim().split(/\s+/)[0] || sampleApplicant.fullName;
    const timeStr = format(new Date(session.startTime), "h:mm a");
    const dateStr = format(new Date(session.event.date), "eeee, do MMMM yyyy");
    const venueStr = session.event.venue || "East Legon Office, Accra";
    const mapsUrl = session.event.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(venueStr)}`;

    console.log(`Test Email Details:`);
    console.log(`  - Recipient: ${testEmailArg}`);
    console.log(`  - Applicant First Name: ${firstName}`);
    console.log(`  - Scheduled Date & Time: ${dateStr} at ${timeStr}`);
    console.log(`  - Venue: ${venueStr}`);
    console.log(`  - Maps Link: ${mapsUrl}`);

    const success = await sendVenueConfirmationEmail({
      email: testEmailArg,
      fullName: sampleApplicant.fullName,
      applicantId: sampleApplicant.applicantId,
      startTime: session.startTime,
      endTime: session.endTime,
      eventDate: session.event.date,
      venueName: venueStr,
      locationUrl: mapsUrl,
    });

    if (success) {
      console.log(`✅ TEST EMAIL SUCCESSFULLY SENT TO ${testEmailArg}!`);
    } else {
      console.error(`❌ TEST EMAIL FAILED TO SEND.`);
    }
    return;
  }

  // PRODUCTION MODE
  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const applicant of bookedApplicants) {
    if (applicant.venueConfirmationEmailSent) {
      console.log(`[SKIPPED] ${applicant.fullName} (${applicant.email}) - Already sent venue confirmation.`);
      skippedCount++;
      continue;
    }

    if (!applicant.email) {
      console.warn(`[WARNING] ${applicant.fullName} has no email address recorded.`);
      errorCount++;
      continue;
    }

    const session = applicant.auditionSession;
    if (!session || !session.event) {
      console.warn(`[WARNING] ${applicant.fullName} has no valid audition session details.`);
      errorCount++;
      continue;
    }

    const firstName = applicant.fullName.trim().split(/\s+/)[0] || applicant.fullName;
    const timeStr = format(new Date(session.startTime), "h:mm a");
    const dateStr = format(new Date(session.event.date), "eeee, do MMMM yyyy");
    const venueStr = session.event.venue || "East Legon Office, Accra";
    const mapsUrl = session.event.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(venueStr)}`;

    console.log(`Sending to ${firstName} (${applicant.email}) for ${dateStr} @ ${timeStr}...`);

    const success = await sendVenueConfirmationEmail({
      email: applicant.email,
      fullName: applicant.fullName,
      applicantId: applicant.applicantId,
      startTime: session.startTime,
      endTime: session.endTime,
      eventDate: session.event.date,
      venueName: venueStr,
      locationUrl: mapsUrl,
    });

    if (success) {
      await prisma.recruitmentApplicant.update({
        where: { id: applicant.id },
        data: {
          venueConfirmationEmailSent: true,
          venueConfirmationEmailSentAt: new Date()
        }
      });
      sentCount++;
      console.log(`  ✅ Sent & database updated (venueConfirmationEmailSent = true).`);
    } else {
      errorCount++;
      console.error(`  ❌ Failed to send email to ${applicant.email}.`);
    }
  }

  console.log("\n=================================================");
  console.log("📊 CAMPAIGN EXECUTION SUMMARY");
  console.log("=================================================");
  console.log(`Total Booked Applicants Targeted: ${bookedApplicants.length}`);
  console.log(`Emails Successfully Sent:        ${sentCount}`);
  console.log(`Emails Skipped (Already Sent):   ${skippedCount}`);
  console.log(`Failed / Incomplete:             ${errorCount}`);
  console.log("=================================================\n");
}

runCampaign()
  .catch((err) => {
    console.error("Campaign failed with error:", err);
  })
  .finally(() => prisma.$disconnect());
