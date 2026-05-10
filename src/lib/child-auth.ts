import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) throw new Error("AUTH_SECRET is not set");
const key = new TextEncoder().encode(secretKey);

export async function signChildToken(payload: { childId: string; username: string; parentId: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyChildToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as { childId: string; username: string; parentId: string };
  } catch (error) {
    return null;
  }
}

export async function setChildSession(childId: string, username: string, parentId: string) {
  const token = await signChildToken({ childId, username, parentId });
  const cookieStore = await cookies();
  cookieStore.set("child_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getChildSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("child_session")?.value;
  if (!token) return null;
  return await verifyChildToken(token);
}

export async function clearChildSession() {
  const cookieStore = await cookies();
  cookieStore.delete("child_session");
}
