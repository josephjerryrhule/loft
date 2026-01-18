import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Handle local file uploads
    if (url.startsWith('/uploads/')) {
        const fs = require('fs').promises;
        const path = require('path');
        const fullPath = path.join(process.cwd(), 'public', url);
        
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

    // Validate remote URL (Supabase or other trusted sources if needed)
    // For now, we loosen the check to allow migration testing, or keep it strict if desired.
    // But since we are moving away from Supabase, we might want to allow others?
    // Let's keep it somewhat safe but allow valid URLs.
    if (!url.startsWith('http')) {
       return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
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
