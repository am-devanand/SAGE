import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/_next", "/favicon.ico", "/api", "/manifest"];

function isPublic(pathname: string): boolean {
  if (pathname.includes(".")) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  // also allow select-plant for logged-in users only — but unauthenticated should go to login first
  const hasUser = req.cookies.get("sage-user")?.value;
  if (!hasUser) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
