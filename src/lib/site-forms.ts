import { NextRequest, NextResponse } from "next/server";

// Shared guard for the landoffairytales.com forms: allowed origins (CORS), a honeypot field and a small rate limit.
const ORIGINS = (process.env.SITE_ORIGINS || "https://landoffairytales.com,https://www.landoffairytales.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ORIGINS.includes(origin) ? origin : ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export function reply(req: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
}

export function originAllowed(req: NextRequest): boolean {
  return ORIGINS.includes(req.headers.get("origin") || "");
}

// At most 5 submissions per address every 10 minutes (per server process).
const hits = new Map<string, number[]>();
export function rateLimited(req: NextRequest): boolean {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

export function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 160;
