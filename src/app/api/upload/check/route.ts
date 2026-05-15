import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  // Only Admin can use the diagnostic tool
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // 1. Resolve the path exactly like the upload utility does
    const relativePath = fileUrl.replace('/uploads/', ''); 
    const baseUploadDir = process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
    const fullPath = path.join(baseUploadDir, relativePath);

    // 2. Check if file exists
    const exists = fs.existsSync(fullPath);
    
    // 3. Get directory info
    const dirPath = path.dirname(fullPath);
    const dirExists = fs.existsSync(dirPath);
    
    let stats = null;
    if (exists) {
        const s = fs.statSync(fullPath);
        stats = {
            size: s.size,
            mode: s.mode,
            uid: s.uid,
            gid: s.gid,
            createdAt: s.birthtime,
            permissions: (s.mode & 0o777).toString(8)
        };
    }

    let dirStats = null;
    if (dirExists) {
        const s = fs.statSync(dirPath);
        dirStats = {
            mode: s.mode,
            permissions: (s.mode & 0o777).toString(8)
        };
    }

    return NextResponse.json({
        diagnostics: {
            requestUrl: fileUrl,
            resolvedPath: fullPath,
            fileExists: exists,
            fileStats: stats,
            directoryPath: dirPath,
            directoryExists: dirExists,
            directoryStats: dirStats,
            cwd: process.cwd(),
            envBaseDir: process.env.UPLOAD_DIR_BASE || "Not Set",
        }
    });
  } catch (error: any) {
    return NextResponse.json({ 
        error: "Diagnostic failed", 
        message: error.message,
        stack: error.stack
    }, { status: 500 });
  }
}
