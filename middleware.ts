import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {

  // Only check if the session token is present in the request cookies 
  // We still need to check if the session token is valid on the page itself

  let sessionToken;
  if (process.env.NODE_ENV === "production") {
    sessionToken = request.cookies.get("__Secure-authjs.session-token");
  } else {
    sessionToken = request.cookies.get("authjs.session-token");
  }

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/* (API endpoints)
     * 2. /login (login page)
     * 3. /_next (Next.js internals)
     * 4. /static (static files)
     * 5. /favicon.ico, etc. (static files)
     */
    "/((?!api/|login|logout|_next|static|favicon.ico).*)",
  ],
};
