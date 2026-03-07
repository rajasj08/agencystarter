import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./constants/routes";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/superadmin"];
const PROTECTED_PATHS = [ROUTES.CHANGE_PASSWORD];
const AUTH_PAGES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD, ROUTES.VERIFY_EMAIL, ROUTES.RESET_PASSWORD];

function isProtected(pathname: string) {
  return (
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?"))
  );
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "?"));
}

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.get("auth_session")?.value === "1";
  const { pathname } = req.nextUrl;

  if (isProtected(pathname) && !hasSession) {
    const url = new URL(ROUTES.LOGIN, req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage(pathname) && hasSession) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/superadmin/:path*", "/login", "/register", "/forgot-password", "/verify-email", "/reset-password", "/change-password"],
};
