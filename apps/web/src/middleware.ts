import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simple JWT token check - token is in httpOnly cookie
  const token = request.cookies.get('auth_token')?.value;
  
  // Allow access to auth pages without token
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    // If user has token and is on auth page, redirect to home
    if (token && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  
  // Redirect to login if no token and not on auth page or API route
  if (!token && !request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
