import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const protectedRoutes = ["/dashboard", "/onboarding", "/plans"];
  const isProtected = protectedRoutes.some((r) => nextUrl.pathname.startsWith(r));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
