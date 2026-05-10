import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { recordSiteVisit } from "@/lib/analytics";

type VisitPayload = {
  path?: string;
  referrer?: string;
  visitorId?: string;
};

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  return origin === new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Origin không hợp lệ.",
      },
      { status: 403 }
    );
  }

  let payload: VisitPayload;

  try {
    payload = (await request.json()) as VisitPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Payload thống kê không hợp lệ.",
      },
      { status: 400 }
    );
  }

  try {
    await recordSiteVisit({
      path: payload.path,
      referrer: payload.referrer,
      visitorId: payload.visitorId,
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể ghi lượt truy cập.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
