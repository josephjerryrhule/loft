"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { getPaystackSecretKey } from "@/lib/paystack";
import { initializePaystackTransaction } from "@/lib/paystack";

// ═══════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════

import { RECRUITMENT_STATUSES, type RecruitmentStatus } from "@/lib/recruitment-constants";

const APPLICATION_FEE = 100; // GHC 100

// ═══════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════

const applicationSchema = z.object({
  // Section 1: Personal Information
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(16, "Must be at least 16 years old"),
  gender: z.enum(["MALE", "FEMALE", "PREFER_NOT_TO_SAY"]),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  residentialArea: z.string().min(1, "Residential area is required"),
  townCity: z.string().min(1, "Town/City is required"),
  region: z.string().min(1, "Region is required"),

  // Section 2: Education
  highestEducation: z.enum(["SHS", "DIPLOMA", "HND", "BACHELORS", "MASTERS", "OTHER"]),
  institution: z.string().optional().or(z.literal("")),
  course: z.string().optional().or(z.literal("")),

  // Section 3: Experience
  workedWithChildren: z.boolean(),
  childrenExperienceDesc: z.string().optional().or(z.literal("")),
  previousRoles: z.array(z.string()).min(1, "Select at least one option"),
  relevantExperience: z.string().optional().or(z.literal("")),

  // Section 4: Communication & Facilitation
  groupSpeakingComfort: z.enum([
    "VERY_COMFORTABLE",
    "COMFORTABLE",
    "SOMEWHAT_COMFORTABLE",
    "NOT_COMFORTABLE",
  ]),
  ledGroupActivity: z.boolean(),
  groupActivityDesc: z.string().optional().or(z.literal("")),
  whatMakesLearningFun: z.string().min(10, "Please provide a more detailed response"),
  engagementSkills: z.string().min(10, "Please provide a more detailed response"),

  // Section 5: Short Answers
  whyFacilitator: z.string().min(10, "Please provide a more detailed response"),
  strengths: z.string().min(10, "Please provide a more detailed response"),
  problemSolvingExample: z.string().min(10, "Please provide a more detailed response"),

  // Section 6: Audition Information
  auditionUnderstood: z.literal(true, {
    message: "You must acknowledge the audition requirement",
  }),
  willingToTravel: z.literal(true, {
    message: "You must be willing to travel to the audition venue",
  }),

  // Declaration
  declarationAgreed: z.literal(true, {
    message: "You must agree to the declaration",
  }),
  declarationName: z.string().min(2, "Full name is required"),
  declarationDate: z.string().min(1, "Date is required"),
});

// ═══════════════════════════════════════════════════════════
// HELPER: Generate Applicant ID
// ═══════════════════════════════════════════════════════════

async function generateApplicantId(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `LOFT-RC-${yy}${mm}${dd}`;

  // Find the highest sequence number for today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const lastApplicant = await prisma.recruitmentApplicant.findFirst({
    where: {
      applicantId: { startsWith: prefix },
    },
    orderBy: { applicantId: "desc" },
    select: { applicantId: true },
  });

  let sequence = 1;
  if (lastApplicant) {
    const lastSeq = parseInt(lastApplicant.applicantId.split("-").pop() || "0", 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

// ═══════════════════════════════════════════════════════════
// HELPER: Check admin authorization
// ═══════════════════════════════════════════════════════════

async function requireRecruitmentAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated", userId: null };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "OPERATIONS_MANAGER")) {
    return { error: "Unauthorized", userId: null };
  }
  return { error: null, userId: session.user.id };
}

// ═══════════════════════════════════════════════════════════
// PUBLIC ACTIONS (No auth required)
// ═══════════════════════════════════════════════════════════

/**
 * Submit a new recruitment application.
 * Creates the applicant record with status PENDING_PAYMENT and returns the applicant ID.
 */
export async function submitApplication(
  data: z.infer<typeof applicationSchema>
) {
  try {
    const validated = applicationSchema.parse(data);

    const applicantId = await generateApplicantId();

    const applicant = await prisma.recruitmentApplicant.create({
      data: {
        applicantId,
        status: "PENDING_PAYMENT",
        fullName: validated.fullName,
        dateOfBirth: new Date(validated.dateOfBirth),
        age: validated.age,
        gender: validated.gender,
        phoneNumber: validated.phoneNumber,
        whatsappNumber: validated.whatsappNumber,
        email: validated.email || null,
        residentialArea: validated.residentialArea,
        townCity: validated.townCity,
        region: validated.region,
        highestEducation: validated.highestEducation,
        institution: validated.institution || null,
        course: validated.course || null,
        workedWithChildren: validated.workedWithChildren,
        childrenExperienceDesc: validated.childrenExperienceDesc || null,
        previousRoles: JSON.stringify(validated.previousRoles),
        relevantExperience: validated.relevantExperience || null,
        groupSpeakingComfort: validated.groupSpeakingComfort,
        ledGroupActivity: validated.ledGroupActivity,
        groupActivityDesc: validated.groupActivityDesc || null,
        whatMakesLearningFun: validated.whatMakesLearningFun,
        engagementSkills: validated.engagementSkills,
        whyFacilitator: validated.whyFacilitator,
        strengths: validated.strengths,
        problemSolvingExample: validated.problemSolvingExample,
        auditionUnderstood: validated.auditionUnderstood,
        willingToTravel: validated.willingToTravel,
        declarationAgreed: validated.declarationAgreed,
        declarationName: validated.declarationName,
        declarationDate: new Date(validated.declarationDate),
      },
    });

    // Record the status change
    await prisma.recruitmentStatusHistory.create({
      data: {
        applicantId: applicant.id,
        fromStatus: "DRAFT",
        toStatus: "PENDING_PAYMENT",
        changedBy: "SYSTEM",
        note: "Application submitted, awaiting payment",
      },
    });

    return { success: true, applicantId: applicant.applicantId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0]?.message || "Validation failed" };
    }
    console.error("Application submission error:", error);
    return { success: false, error: "Failed to submit application. Please try again." };
  }
}

/**
 * Initialize a Paystack payment for the recruitment application fee.
 */
export async function initializeRecruitmentPayment(applicantId: string) {
  try {
    const applicant = await prisma.recruitmentApplicant.findUnique({
      where: { applicantId },
      select: {
        id: true,
        applicantId: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        paymentStatus: true,
        status: true,
      },
    });

    if (!applicant) {
      return { success: false, error: "Application not found" };
    }

    if (applicant.paymentStatus === "PAID") {
      return { success: false, error: "Payment has already been completed" };
    }

    // Generate a unique reference
    const reference = `RCT-${applicant.applicantId}-${Date.now()}`;

    // Use applicant email or a placeholder (Paystack requires an email)
    const email = applicant.email || `${applicant.applicantId.toLowerCase()}@applicant.loft.local`;

    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await initializePaystackTransaction({
      email,
      amount: APPLICATION_FEE,
      reference,
      callbackUrl: `${appUrl}/recruitment/payment/callback`,
      metadata: {
        type: "recruitment",
        applicantId: applicant.applicantId,
        applicantDbId: applicant.id,
        fullName: applicant.fullName,
        custom_fields: [
          {
            display_name: "Applicant ID",
            variable_name: "applicant_id",
            value: applicant.applicantId,
          },
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: "Application & Assessment Fee",
          },
        ],
      },
    });

    if (result.success && result.authorizationUrl) {
      // Store reference on the applicant record
      await prisma.recruitmentApplicant.update({
        where: { id: applicant.id },
        data: { paymentReference: reference },
      });

      return { success: true, authorizationUrl: result.authorizationUrl, reference };
    }

    return { success: false, error: result.error || "Failed to initialize payment" };
  } catch (error) {
    console.error("Payment initialization error:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}

/**
 * Process a successful recruitment payment (called by webhook or callback).
 */
export async function processRecruitmentPayment(reference: string, applicantIdFromMeta?: string) {
  try {
    // Find applicant by payment reference
    let applicant = await prisma.recruitmentApplicant.findFirst({
      where: { paymentReference: reference },
    });

    // If not found by reference, try by applicant ID from metadata
    if (!applicant && applicantIdFromMeta) {
      applicant = await prisma.recruitmentApplicant.findUnique({
        where: { applicantId: applicantIdFromMeta },
      });
    }

    if (!applicant) {
      console.error("Recruitment payment: applicant not found for reference:", reference);
      return { success: false, error: "Applicant not found" };
    }

    if (applicant.paymentStatus === "PAID") {
      return { success: true, message: "Payment already processed" };
    }

    const previousStatus = applicant.status;

    // Update applicant record
    await prisma.recruitmentApplicant.update({
      where: { id: applicant.id },
      data: {
        paymentStatus: "PAID",
        paymentReference: reference,
        paymentAmount: APPLICATION_FEE,
        paidAt: new Date(),
        status: "APPLICATION_SUBMITTED",
      },
    });

    // Record status change
    await prisma.recruitmentStatusHistory.create({
      data: {
        applicantId: applicant.id,
        fromStatus: previousStatus,
        toStatus: "APPLICATION_SUBMITTED",
        changedBy: "SYSTEM",
        note: `Payment confirmed (Ref: ${reference})`,
      },
    });

    // Send confirmation email if applicant has an email
    if (applicant.email) {
      try {
        const { sendRecruitmentConfirmationEmail } = await import("@/lib/email");
        await sendRecruitmentConfirmationEmail({
          email: applicant.email,
          fullName: applicant.fullName,
          applicantId: applicant.applicantId,
        });
      } catch (emailErr) {
        console.error("Failed to send recruitment confirmation email:", emailErr);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Process recruitment payment error:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

/**
 * Verify a recruitment payment by checking Paystack API directly.
 * Used by the callback page when the webhook hasn't fired yet.
 */
export async function verifyRecruitmentPayment(reference: string) {
  try {
    const secretKey = await getPaystackSecretKey();
    if (!secretKey) {
      return { success: false, error: "Payment configuration error" };
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const result = await response.json();

    if (result.status && result.data?.status === "success") {
      // Process the payment
      const applicantId = result.data?.metadata?.applicantId;
      await processRecruitmentPayment(reference, applicantId);
      return { success: true, applicantId };
    }

    return { success: false, error: "Payment verification failed" };
  } catch (error) {
    console.error("Payment verification error:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

/**
 * Lookup application status by applicant ID (public).
 * Only returns safe, non-sensitive information.
 */
export async function lookupApplicationStatus(applicantId: string) {
  try {
    const applicant = await prisma.recruitmentApplicant.findUnique({
      where: { applicantId: applicantId.toUpperCase().trim() },
      select: {
        applicantId: true,
        fullName: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        paidAt: true,
      },
    });

    if (!applicant) {
      return { success: false, error: "Application not found. Please check your Application ID." };
    }

    return {
      success: true,
      data: {
        applicantId: applicant.applicantId,
        fullName: applicant.fullName,
        status: applicant.status,
        paymentStatus: applicant.paymentStatus,
        submittedAt: applicant.createdAt.toISOString(),
        paidAt: applicant.paidAt?.toISOString() || null,
      },
    };
  } catch (error) {
    console.error("Status lookup error:", error);
    return { success: false, error: "Failed to look up application status" };
  }
}

// ═══════════════════════════════════════════════════════════
// ADMIN ACTIONS (Auth required: ADMIN or OPERATIONS_MANAGER)
// ═══════════════════════════════════════════════════════════

/**
 * Get aggregate stats for the recruitment dashboard.
 */
export async function getRecruitmentDashboardStats() {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const [statusCounts, paymentCounts, totalCount] = await Promise.all([
    prisma.recruitmentApplicant.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.recruitmentApplicant.groupBy({
      by: ["paymentStatus"],
      _count: { paymentStatus: true },
    }),
    prisma.recruitmentApplicant.count(),
  ]);

  const stats: Record<string, number> = { total: totalCount };
  statusCounts.forEach((s) => {
    stats[s.status] = s._count.status;
  });
  paymentCounts.forEach((p) => {
    stats[`payment_${p.paymentStatus}`] = p._count.paymentStatus;
  });

  return { stats };
}

/**
 * Get paginated, filterable list of applicants.
 */
export async function getRecruitmentApplicants(filters?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters?.search) {
    const search = filters.search.trim();
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { applicantId: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { townCity: { contains: search, mode: "insensitive" } },
    ];
  }

  const [applicants, total] = await Promise.all([
    prisma.recruitmentApplicant.findMany({
      where,
      select: {
        id: true,
        applicantId: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        townCity: true,
        region: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        highestEducation: true,
        auditionScores: {
          select: { totalScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.recruitmentApplicant.count({ where }),
  ]);

  return {
    applicants: applicants.map((a) => ({
      ...a,
      averageScore:
        a.auditionScores.length > 0
          ? Math.round(
              a.auditionScores.reduce((sum, s) => sum + s.totalScore, 0) /
                a.auditionScores.length
            )
          : null,
      auditionScores: undefined,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get full applicant profile with all data.
 */
export async function getApplicantProfile(applicantId: string) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
    include: {
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      auditionScores: {
        orderBy: { createdAt: "desc" },
      },
      auditionSession: {
        include: {
          event: true,
        },
      },
    },
  });

  if (!applicant) {
    return { error: "Applicant not found" };
  }

  return { applicant };
}

/**
 * Update an applicant's recruitment status.
 */
export async function updateApplicantStatus(
  applicantId: string,
  newStatus: RecruitmentStatus,
  note?: string
) {
  const { error, userId } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
    select: { id: true, status: true, email: true, fullName: true },
  });

  if (!applicant) return { error: "Applicant not found" };

  const previousStatus = applicant.status;

  await prisma.recruitmentApplicant.update({
    where: { id: applicant.id },
    data: { status: newStatus },
  });

  await prisma.recruitmentStatusHistory.create({
    data: {
      applicantId: applicant.id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      changedBy: userId,
      note: note || null,
    },
  });

  // Send audition invitation email if status is AUDITION_INVITED
  if (newStatus === "AUDITION_INVITED" && applicant.email) {
    try {
      const { sendAuditionInvitationEmail } = await import("@/lib/email");
      await sendAuditionInvitationEmail({
        email: applicant.email,
        fullName: applicant.fullName,
        applicantId,
      });
    } catch (emailErr) {
      console.error("Failed to send audition invitation email:", emailErr);
    }
  }

  return { success: true };
}

/**
 * Add internal notes to an applicant's record.
 */
export async function addApplicantNote(applicantId: string, note: string) {
  const { error, userId } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
    select: { id: true, internalNotes: true },
  });

  if (!applicant) return { error: "Applicant not found" };

  const timestamp = new Date().toISOString();
  const newNote = `[${timestamp}] ${note}`;
  const updatedNotes = applicant.internalNotes
    ? `${applicant.internalNotes}\n${newNote}`
    : newNote;

  await prisma.recruitmentApplicant.update({
    where: { id: applicant.id },
    data: { internalNotes: updatedNotes },
  });

  return { success: true };
}

/**
 * Bulk update status for multiple applicants.
 */
export async function bulkUpdateStatus(
  applicantIds: string[],
  newStatus: RecruitmentStatus,
  note?: string
) {
  const { error, userId } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicants = await prisma.recruitmentApplicant.findMany({
    where: { applicantId: { in: applicantIds } },
    select: { id: true, applicantId: true, status: true },
  });

  for (const applicant of applicants) {
    await prisma.recruitmentApplicant.update({
      where: { id: applicant.id },
      data: { status: newStatus },
    });

    await prisma.recruitmentStatusHistory.create({
      data: {
        applicantId: applicant.id,
        fromStatus: applicant.status,
        toStatus: newStatus,
        changedBy: userId,
        note: note || `Bulk status update`,
      },
    });
  }

  return { success: true, count: applicants.length };
}

/**
 * Export applicants as CSV data.
 */
export async function exportApplicants(filters?: {
  status?: string;
  paymentStatus?: string;
}) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;

  const applicants = await prisma.recruitmentApplicant.findMany({
    where,
    include: {
      auditionScores: {
        select: { totalScore: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Applicant ID",
    "Full Name",
    "Age",
    "Gender",
    "Phone Number",
    "WhatsApp",
    "Email",
    "Town/City",
    "Region",
    "Education",
    "Status",
    "Payment Status",
    "Average Score",
    "Applied At",
  ];

  const rows = applicants.map((a) => {
    const avgScore =
      a.auditionScores.length > 0
        ? Math.round(
            a.auditionScores.reduce((sum, s) => sum + s.totalScore, 0) /
              a.auditionScores.length
          )
        : "";

    return [
      a.applicantId,
      a.fullName,
      a.age,
      a.gender,
      a.phoneNumber,
      a.whatsappNumber,
      a.email || "",
      a.townCity,
      a.region,
      a.highestEducation,
      a.status,
      a.paymentStatus,
      avgScore,
      new Date(a.createdAt).toLocaleDateString(),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  return { csv };
}

// ═══════════════════════════════════════════════════════════
// AUDITION MANAGEMENT (Admin only)
// ═══════════════════════════════════════════════════════════

/**
 * Create an audition event.
 */
export async function createAuditionEvent(data: {
  name: string;
  date: string;
  venue: string;
  description?: string;
  maxCapacity?: number;
}) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const event = await prisma.recruitmentAuditionEvent.create({
    data: {
      name: data.name,
      date: new Date(data.date),
      venue: data.venue,
      description: data.description || null,
      maxCapacity: data.maxCapacity || null,
    },
  });

  return { success: true, event };
}

/**
 * Create an audition session within an event.
 */
export async function createAuditionSession(data: {
  eventId: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
}) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const session = await prisma.recruitmentAuditionSession.create({
    data: {
      eventId: data.eventId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      maxCapacity: data.maxCapacity || null,
    },
  });

  return { success: true, session };
}

/**
 * Assign an applicant to an audition session.
 */
export async function assignApplicantToSession(
  applicantId: string,
  sessionId: string
) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
  });

  if (!applicant) return { error: "Applicant not found" };

  await prisma.recruitmentApplicant.update({
    where: { id: applicant.id },
    data: { auditionSessionId: sessionId },
  });

  return { success: true };
}

/**
 * Submit audition scores for an applicant.
 */
export async function submitAuditionScore(data: {
  applicantId: string;
  sessionId?: string;
  evaluatorName: string;
  readingAbility: number;
  storytellingAbility: number;
  childEngagement: number;
  communicationSkills: number;
  confidence: number;
  improvisation: number;
  overallRecommendation: number;
  evaluatorNotes?: string;
  attended: boolean;
}) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId: data.applicantId },
    select: { id: true },
  });

  if (!applicant) return { error: "Applicant not found" };

  const totalScore =
    data.readingAbility +
    data.storytellingAbility +
    data.childEngagement +
    data.communicationSkills +
    data.confidence +
    data.improvisation +
    data.overallRecommendation;

  const score = await prisma.recruitmentAuditionScore.create({
    data: {
      applicantId: applicant.id,
      sessionId: data.sessionId || null,
      evaluatorName: data.evaluatorName,
      readingAbility: data.readingAbility,
      storytellingAbility: data.storytellingAbility,
      childEngagement: data.childEngagement,
      communicationSkills: data.communicationSkills,
      confidence: data.confidence,
      improvisation: data.improvisation,
      overallRecommendation: data.overallRecommendation,
      totalScore,
      evaluatorNotes: data.evaluatorNotes || null,
      attended: data.attended,
    },
  });

  return { success: true, score };
}

/**
 * Get all audition events with sessions and assigned applicants.
 */
export async function getAuditionEvents() {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const events = await prisma.recruitmentAuditionEvent.findMany({
    include: {
      sessions: {
        include: {
          applicants: {
            select: {
              applicantId: true,
              fullName: true,
              phoneNumber: true,
              status: true,
            },
          },
          _count: {
            select: { applicants: true },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });

  return { events };
}

/**
 * Get all audition events (including isReleased) for admin management.
 * Returns a simplified version for the admin auditions page.
 */
export async function getAuditionEventsForAdmin() {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const events = await prisma.recruitmentAuditionEvent.findMany({
    select: {
      id: true,
      name: true,
      date: true,
      venue: true,
      description: true,
      maxCapacity: true,
      isReleased: true,
      createdAt: true,
      sessions: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          maxCapacity: true,
          applicants: {
            select: {
              applicantId: true,
              fullName: true,
              phoneNumber: true,
              status: true,
            },
          },
          _count: {
            select: { applicants: true },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });

  return { events };
}

/**
 * Release or close audition slots for an event.
 * When released: eligible applicants (APPLICATION_SUBMITTED, AWAITING_AUDITION_SLOT_RELEASE) 
 * are moved to AUDITION_BOOKING_OPEN so they can self-book.
 * When closed: booking is closed but existing bookings remain.
 */
export async function releaseAuditionSlots(eventId: string, release: boolean) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const event = await prisma.recruitmentAuditionEvent.findUnique({
    where: { id: eventId },
    include: { sessions: true },
  });

  if (!event) return { error: "Event not found" };

  // Update event released status
  await prisma.recruitmentAuditionEvent.update({
    where: { id: eventId },
    data: { isReleased: release },
  });

  if (release) {
    // Find applicants eligible for booking: APPLICATION_SUBMITTED or AWAITING_AUDITION_SLOT_RELEASE
    // who don't already have a session assigned
    const eligibleApplicants = await prisma.recruitmentApplicant.findMany({
      where: {
        status: { in: ["APPLICATION_SUBMITTED", "AWAITING_AUDITION_SLOT_RELEASE"] },
        auditionSessionId: null,
      },
      select: { id: true, applicantId: true, status: true },
    });

    if (eligibleApplicants.length > 0) {
      // Bulk update to AUDITION_BOOKING_OPEN
      await prisma.recruitmentApplicant.updateMany({
        where: { id: { in: eligibleApplicants.map((a) => a.id) } },
        data: { status: "AUDITION_BOOKING_OPEN" },
      });

      // Create status history entries
      await prisma.recruitmentStatusHistory.createMany({
        data: eligibleApplicants.map((a) => ({
          applicantId: a.id,
          fromStatus: a.status,
          toStatus: "AUDITION_BOOKING_OPEN",
          changedBy: "SYSTEM",
          note: `Audition slots released for event: ${event.name}`,
        })),
      });
    }

    return { 
      success: true, 
      message: `Slots released. ${eligibleApplicants.length} applicants can now book.`,
      applicantsNotified: eligibleApplicants.length 
    };
  } else {
    // Closing slots - no status change for applicants, just prevent new bookings
    return { success: true, message: "Booking closed for this event." };
  }
}

/**
 * Delete an audition event and all its sessions.
 */
export async function deleteAuditionEvent(eventId: string) {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  // Unassign all applicants from sessions of this event first
  const sessions = await prisma.recruitmentAuditionSession.findMany({
    where: { eventId },
    select: { id: true },
  });

  if (sessions.length > 0) {
    await prisma.recruitmentApplicant.updateMany({
      where: { auditionSessionId: { in: sessions.map((s) => s.id) } },
      data: { auditionSessionId: null },
    });
  }

  await prisma.recruitmentAuditionEvent.delete({
    where: { id: eventId },
  });

  return { success: true };
}

/**
 * Get recruitment analytics (funnel metrics).
 */
export async function getRecruitmentAnalytics() {
  const { error } = await requireRecruitmentAdmin();
  if (error) return { error };

  const [
    totalApplicants,
    pendingPayment,
    paidApplicants,
    submitted,
    underReview,
    auditionInvited,
    auditionAttended,
    shortlisted,
    selected,
    hired,
    rejected,
  ] = await Promise.all([
    prisma.recruitmentApplicant.count(),
    prisma.recruitmentApplicant.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.recruitmentApplicant.count({ where: { paymentStatus: "PAID" } }),
    prisma.recruitmentApplicant.count({ where: { status: "APPLICATION_SUBMITTED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.recruitmentApplicant.count({ where: { status: "AUDITION_INVITED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "AUDITION_ATTENDED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "SHORTLISTED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "SELECTED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "HIRED" } }),
    prisma.recruitmentApplicant.count({ where: { status: "REJECTED" } }),
  ]);

  // Application by day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyApplications = await prisma.recruitmentApplicant.groupBy({
    by: ["createdAt"],
    _count: { id: true },
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  return {
    analytics: {
      totalApplicants,
      pendingPayment,
      paidApplicants,
      submitted,
      underReview,
      auditionInvited,
      auditionAttended,
      shortlisted,
      selected,
      hired,
      rejected,
      paymentConversionRate:
        totalApplicants > 0
          ? Math.round((paidApplicants / totalApplicants) * 100)
          : 0,
      auditionAttendanceRate:
        auditionInvited > 0
          ? Math.round((auditionAttended / auditionInvited) * 100)
          : 0,
      selectionRate:
        auditionAttended > 0
          ? Math.round((selected / auditionAttended) * 100)
          : 0,
      hiringRate:
        totalApplicants > 0
          ? Math.round((hired / totalApplicants) * 100)
          : 0,
    },
  };
}

/**
 * Public action: Get applicant details for the public audition confirmation page
 */
export async function getApplicantForConfirmation(applicantId: string) {
  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
    select: {
      applicantId: true,
      fullName: true,
      status: true,
      auditionSession: {
        include: {
          event: true,
        },
      },
    },
  });

  if (!applicant) {
    return { error: "Applicant not found" };
  }

  return { applicant };
}

/**
 * Public action: Confirm attendance for an audition session
 */
export async function confirmAuditionAttendance(applicantId: string) {
  const applicant = await prisma.recruitmentApplicant.findUnique({
    where: { applicantId },
  });

  if (!applicant) {
    return { error: "Applicant not found" };
  }

  if (applicant.status !== "AUDITION_INVITED") {
    if (applicant.status === "AUDITION_CONFIRMED") {
      return { success: true, message: "Already confirmed" };
    }
    return { error: "Invalid status for confirmation" };
  }

  await prisma.recruitmentApplicant.update({
    where: { applicantId },
    data: { status: "AUDITION_CONFIRMED" },
  });

  // Log the action
  await prisma.activityLog.create({
    data: {
      userId: applicant.email || applicant.applicantId,
      actionType: "AUDITION_CONFIRMED_BY_APPLICANT",
      actionDetails: JSON.stringify({
        applicantId,
      }),
    },
  });

  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// APPLICANT PORTAL
// ═══════════════════════════════════════════════════════════

export async function getApplicantPortalData(applicantId: string) {
  try {
    const applicant = await prisma.recruitmentApplicant.findUnique({
      where: { applicantId },
      include: {
        auditionSession: {
          include: {
            event: true
          }
        }
      }
    });

    if (!applicant) {
      return { success: false, error: "Applicant not found." };
    }

    if (applicant.status === "DRAFT" || applicant.paymentStatus !== "PAID") {
      return { success: false, error: "Portal access requires a submitted application with successful payment." };
    }

    let availableSessions = null;
    const bookingEligibleStatuses = ["AUDITION_BOOKING_OPEN", "AUDITION_INVITED", "SHORTLISTED"];
    if (bookingEligibleStatuses.includes(applicant.status)) {
      // Fetch future RELEASED events and sessions only
      const events = await prisma.recruitmentAuditionEvent.findMany({
        where: { 
          date: { gte: new Date() },
          isReleased: true
        },
        include: {
          sessions: {
            include: {
              _count: {
                select: { applicants: true }
              }
            }
          }
        },
        orderBy: { date: "asc" }
      });
      
      // Filter out full sessions if maxCapacity is set
      availableSessions = events.map(event => ({
        ...event,
        sessions: event.sessions.filter(s => !s.maxCapacity || s._count.applicants < s.maxCapacity)
      })).filter(event => event.sessions.length > 0);
    }

    // Fetch library flipbooks (retrieve all published books for a diverse prep library)
    const libraryFlipbooks = await prisma.flipbook.findMany({
      where: {
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if library access is valid (1 month from paidAt or createdAt)
    const accessStartDate = applicant.paidAt || applicant.createdAt;
    const accessExpiryDate = new Date(accessStartDate);
    accessExpiryDate.setMonth(accessExpiryDate.getMonth() + 1);
    const hasLibraryAccess = new Date() <= accessExpiryDate;

    return {
      success: true,
      data: {
        applicant,
        availableSessions,
        libraryFlipbooks: hasLibraryAccess ? libraryFlipbooks : [],
        hasLibraryAccess,
        accessExpiryDate,
      }
    };
  } catch (error) {
    console.error("Failed to fetch applicant portal data:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function bookAuditionSession(applicantId: string, sessionId: string) {
  try {
    const applicant = await prisma.recruitmentApplicant.findUnique({
      where: { applicantId }
    });

    if (!applicant) {
      return { success: false, error: "Applicant not found." };
    }

    const bookingEligibleStatuses = ["AUDITION_BOOKING_OPEN", "AUDITION_INVITED", "SHORTLISTED"];
    if (!bookingEligibleStatuses.includes(applicant.status)) {
      return { success: false, error: "Audition booking is not currently open for this applicant." };
    }

    // Use a transaction to ensure we don't overbook
    return await prisma.$transaction(async (tx) => {
      const session = await tx.recruitmentAuditionSession.findUnique({
        where: { id: sessionId },
        include: {
          _count: { select: { applicants: true } }
        }
      });

      if (!session) {
        throw new Error("Session not found.");
      }

      if (session.maxCapacity && session._count.applicants >= session.maxCapacity) {
        throw new Error("This session is already full.");
      }

      const updatedApplicant = await tx.recruitmentApplicant.update({
        where: { id: applicant.id },
        data: {
          auditionSessionId: sessionId,
          status: "AUDITION_SLOT_BOOKED",
          statusHistory: {
            create: {
              fromStatus: "AUDITION_BOOKING_OPEN",
              toStatus: "AUDITION_SLOT_BOOKED",
              note: "Applicant booked an audition slot via portal."
            }
          }
        }
      });

      return { success: true, applicant: updatedApplicant };
    });
  } catch (error: any) {
    console.error("Failed to book audition session:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
