import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PUBLIC_ROUTES – paths that never require authentication.
 * Everything else in the ecosystem is considered protected.
 */
const PUBLIC_ROUTES = ["/login"];

/**
 * SESSION_COOKIE – Firebase Auth sets this cookie when you call
 * `setPersistence(browserSessionPersistence)` or use the Admin SDK to
 * create a session cookie.  For the current client-side-only setup we
 * rely on the `__session` cookie that the Firebase JS SDK writes
 * automatically in some configurations, or the presence of a Firebase
 * ID token stored under the key `firebase:authUser:…`.
 *
 * Because middleware runs on the Edge (no Firebase SDK available), we
 * check for a lightweight presence signal: the Firebase SDK always
 * writes a key that starts with "firebase:authUser" to localStorage,
 * but that is NOT accessible from middleware.
 *
 * ➜ RECOMMENDED APPROACH for Next.js + Firebase:
 *   Use a signed HttpOnly session cookie (set via an API route after
 *   verifying the ID token with the Firebase Admin SDK).
 *   The cookie name below must match what your API route sets.
 *
 * For the MVP we use a simple boolean cookie called `ta_session`
 * that the AuthContext sets/clears on login/logout via document.cookie.
 */
const SESSION_COOKIE = "ta_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session || !session.value) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the originally requested URL so we can redirect back after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   *  - _next/static  (static files)
   *  - _next/image   (image optimization)
   *  - favicon.ico
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
