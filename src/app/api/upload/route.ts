import { NextRequest, NextResponse } from "next/server";
import { saveFileLocally } from "@/lib/upload";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/avif",
  // "image/gif", // Removed per user request
  // "image/webp", // Removed per user request
  // "text/plain", // Removed per user request
  // "application/msword", // Removed per user request
  // "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Removed per user request
];

// Route segment config for App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Max execution time in seconds

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must not exceed 15MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Allowed: PDF, images, TXT, DOC, DOCX" },
        { status: 400 }
      );
    }

    // Validate file name (prevent directory traversal)
    if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    const publicUrl = await saveFileLocally(file, folder);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
