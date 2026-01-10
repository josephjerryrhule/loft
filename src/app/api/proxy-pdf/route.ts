import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate it's a Supabase URL
    if (!url.includes('supabase.co')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log('🔄 Proxying PDF request:', url);

    // Fetch the PDF from Supabase
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
    console.log(`✅ PDF fetched successfully: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

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
