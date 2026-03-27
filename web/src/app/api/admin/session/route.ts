import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_HOME_PATH,
  applyAdminSessionCookie,
  authenticateAdminCredentials,
  clearAdminSessionCookie,
  createAdminSessionToken,
  ensureSameOrigin,
  formatAdminAuthSetupMessage,
  getAdminAuthSetupIssues,
} from "@/lib/admin-session";

type LoginPayload = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const sameOriginResponse = ensureSameOrigin(request);

  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const issues = getAdminAuthSetupIssues();

  if (issues.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: formatAdminAuthSetupMessage(),
      },
      { status: 503 }
    );
  }

  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Payload đăng nhập không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const email = String(payload.email || "").trim();
  const password = String(payload.password || "");

  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Bạn cần nhập email và mật khẩu admin.",
      },
      { status: 400 }
    );
  }

  try {
    const session = await authenticateAdminCredentials(email, password);
    const token = await createAdminSessionToken(session);
    const response = NextResponse.json({
      success: true,
      redirectTo: ADMIN_HOME_PATH,
    });

    applyAdminSessionCookie(response, token, session);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Đăng nhập admin thất bại.",
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  });

  clearAdminSessionCookie(response);

  return response;
}
