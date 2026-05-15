import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { apiRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "anonymous";
    const { success } = await apiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const fileUrl = request.nextUrl.searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }

    // Only allow downloads from /uploads directory for security
    if (!fileUrl.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    // Construct local file path
    const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = getMimeType(fileName);

    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-Type", mimeType);
    response.headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
