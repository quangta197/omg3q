import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadPendingAdminImageFiles } from "@/lib/admin-accounts";
import { authorizeAdminApiRequest } from "@/lib/admin-session";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";

function getUploadErrorStatus(message: string) {
  return /không hợp lệ|không phải ảnh|vượt quá 10MB|tối đa/i.test(message)
    ? 400
    : 500;
}

export async function POST(request: NextRequest) {
  const authResult = await authorizeAdminApiRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!hasSupabaseServiceRole()) {
    return NextResponse.json(
      {
        success: false,
        message: "Thiếu SUPABASE_SERVICE_ROLE_KEY cho admin CMS.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu file ảnh cần upload.",
        },
        { status: 400 }
      );
    }

    const [upload] = await uploadPendingAdminImageFiles([file]);

    return NextResponse.json({
      success: true,
      upload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể upload ảnh qua server.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: getUploadErrorStatus(message) }
    );
  }
}
