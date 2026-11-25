import { NextRequest } from "next/server";
import { sendSchoolEnquiryEmails } from "@/lib/email";
import { preflight, reply, originAllowed, rateLimited, text, isEmail } from "@/lib/site-forms";

export const runtime = "nodejs";

const INTERESTS = ["the Confidence Club", "the LOFT school library", "both"];

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

// School enquiry from landoffairytales.com/confidence-club
export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return reply(req, { ok: false, error: "origin" }, 403);
  if (rateLimited(req)) return reply(req, { ok: false, error: "slow-down" }, 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(req, { ok: false, error: "bad-json" }, 400);
  }
  if (text(body.website, 200)) return reply(req, { ok: true }); // honeypot: quietly accept bots

  const e = {
    name: text(body.name, 80),
    school: text(body.school, 120),
    interest: text(body.want, 60),
    children: text(body.size, 20),
    email: text(body.email, 160).toLowerCase(),
    phone: text(body.phone, 40),
  };
  const missing = [!e.name && "name", !e.school && "school", !isEmail(e.email) && "email", !INTERESTS.includes(e.interest) && "want", !e.children && "size"].filter(Boolean);
  if (missing.length) return reply(req, { ok: false, error: "missing", fields: missing }, 422);
  if (e.interest === "both") e.interest = "Both: the Confidence Club and the school library";

  const sent = await sendSchoolEnquiryEmails(e);
  if (!sent.team) return reply(req, { ok: false, error: "send" }, 502);
  return reply(req, { ok: true });
}
