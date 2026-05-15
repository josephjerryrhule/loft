import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Custom static file server for uploads.
 * This is necessary because Next.js does not serve files added to the public/ 
 * folder after the build process (at runtime).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const pathParts = (await params).path;
    const relativePath = pathParts.join('/');
    
    // Resolve base directory
    const baseUploadDir = process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
    const fullPath = path.join(/*turbopackIgnore: true*/ baseUploadDir, relativePath);

    // Security: Ensure the path is within the uploads directory
    if (!fullPath.startsWith(baseUploadDir)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Get file stats
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) {
            return new NextResponse("Not a file", { status: 404 });
        }

        // Read file
        const fileBuffer = fs.readFileSync(fullPath);

        // Determine content type based on extension
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.avif': 'image/avif',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
        };

        const contentType = contentTypeMap[ext] || 'application/octet-stream';

        // Return the file with appropriate headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error("Error serving uploaded file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
