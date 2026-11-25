import { NextRequest } from "next/server";
import { sendEventsSignupEmails } from "@/lib/email";
import { preflight, reply, originAllowed, rateLimited, text, isEmail } from "@/lib/site-forms";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

// "Tell me first" sign-up from landoffairytales.com/events
export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return reply(req, { ok: false, error: "origin" }, 403);
  if (rateLimited(req)) return reply(req, { ok: false, error: "slow-down" }, 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(req, { ok: false, error: "bad-json" }, 400);
  }
  if (text(body.website, 200)) return reply(req, { ok: true });
  const email = text(body.email, 160).toLowerCase();
  if (!isEmail(email)) return reply(req, { ok: false, error: "missing", fields: ["email"] }, 422);
  const sent = await sendEventsSignupEmails(email);
  if (!sent.team) return reply(req, { ok: false, error: "send" }, 502);
  return reply(req, { ok: true });
}
