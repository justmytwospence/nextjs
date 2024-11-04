import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // We don't call auth directly here because this is an edge runtime and authjs
  // is using a database session strategy
  const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
    headers: {
      // Forward cookies to maintain session state
      cookie: request.headers.get('cookie') || '',
    }
  });

  const session = response.ok ? await response.json() : null;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth/* (auth API routes)
     * 2. /login (login page)
     * 3. /_next (Next.js internals)
     * 4. /static (static files)
     * 5. /favicon.ico, etc. (static files)
     */
    '/((?!api/auth|login|_next|static|favicon.ico).*)'
  ]
};