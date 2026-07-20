import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip public auth routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check API key in header or query param
  const apiKey =
    request.headers.get('x-api-key') ||
    request.nextUrl.searchParams.get('key');

  const expectedKey = process.env.API_KEY;

  // If no API_KEY is set, allow (dev mode)
  if (!expectedKey) {
    return NextResponse.next();
  }

  if (apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide x-api-key header or ?key= parameter.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
