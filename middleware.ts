import { auth } from "@/auth";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();

  if (!session) {
    // Redirect to login page if no session is found, including the original URL as a query parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: '/routes/:path*',
};