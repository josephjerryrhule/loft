import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Optimize API routes with proper caching headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Cache static assets aggressively
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Cache API responses for appropriate endpoints
  if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'GET') {
    const publicAPIs = ['/api/auth/session'];
    
    if (publicAPIs.some(api => request.nextUrl.pathname.startsWith(api))) {
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/webpack-hmr (hot module replacement)
     */
    '/((?!api/auth|_next/webpack-hmr).*)',
  ],
};
