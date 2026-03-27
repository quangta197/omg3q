import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  formatAdminAuthSetupMessage,
  getAdminAuthSetupIssues,
  sanitizeAdminNextPath,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

function isAdminLoginPath(pathname: string) {
  return pathname === ADMIN_LOGIN_PATH;
}

function isAdminSessionEndpoint(pathname: string) {
  return pathname === "/api/admin/session";
}

function isAdminApi(pathname: string) {
  return pathname.startsWith("/api/admin");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAdminLoginPath(pathname) || isAdminSessionEndpoint(pathname)) {
    return NextResponse.next();
  }

  const setupIssues = getAdminAuthSetupIssues();

  if (setupIssues.length > 0) {
    if (isAdminApi(pathname)) {
      return NextResponse.json(
        {
          success: false,
          message: formatAdminAuthSetupMessage(),
        },
        { status: 503 }
      );
    }

    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("reason", "setup");

    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get("omg3q_admin_session")?.value;
  const session = await verifyAdminSessionToken(token);

  if (session) {
    return NextResponse.next();
  }

  if (isAdminApi(pathname)) {
    return NextResponse.json(
      {
        success: false,
        message: "Phiên admin không hợp lệ hoặc đã hết hạn.",
      },
      { status: 401 }
    );
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("reason", "auth");
  loginUrl.searchParams.set("next", sanitizeAdminNextPath(`${pathname}${search}`));

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
