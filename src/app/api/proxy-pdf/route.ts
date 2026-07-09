import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { apiRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

const ALLOWED_REMOTE_DOMAINS = [
    'landoffairytales.com',
    'loft.com',
    'supabase.co',
    'heyzine.com',
    'aflip.in'
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Allow access if the user has an active session OR if the request originates from the recruitment portal
    const referer = request.headers.get("referer");
    const isRecruitmentPortal = referer?.includes("/recruitment/portal/") || referer?.includes("/recruitment/confirm-audition/");
    
    if (!session?.user && !isRecruitmentPortal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "anonymous";
    const { success } = await apiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Handle local file uploads
    if (url.startsWith('/uploads/')) {
        const fs = require('fs').promises;
        const path = require('path');
        const fullPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', url);
        
        try {
            const fileBuffer = await fs.readFile(fullPath);
            return new NextResponse(fileBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Length': fileBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        } catch (error) {
           console.error('❌ Failed to read local PDF:', error);
           return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    }

    // Validate remote URL
    if (!url.startsWith('http')) {
       return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Domain check
    try {
        const parsedUrl = new URL(url);
        const isAllowed = ALLOWED_REMOTE_DOMAINS.some(domain => 
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );
        
        if (!isAllowed) {
            return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the PDF from remote source
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch PDF:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.statusText}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { error: `Proxy error: ${error.message}` },
      { status: 500 }
    );
  }
}
