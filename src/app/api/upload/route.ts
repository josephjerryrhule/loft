import { NextRequest, NextResponse } from "next/server";
import { saveFileLocally } from "@/lib/upload";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

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
