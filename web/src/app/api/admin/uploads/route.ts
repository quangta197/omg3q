import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorizeAdminApiRequest } from "@/lib/admin-session";
import {
  createPendingAdminImageUploads,
} from "@/lib/admin-accounts";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";

type UploadRequestBody = {
  files?: Array<{
    name?: string;
    type?: string;
    size?: number;
  }>;
};

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

  let body: UploadRequestBody;

  try {
    body = (await request.json()) as UploadRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu upload ảnh không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const files = (body.files ?? []).map((file, index) => ({
    name: String(file.name || `image-${index + 1}`).trim(),
    type: typeof file.type === "string" ? file.type.trim() : "",
    size: Number(file.size || 0),
  }));

  try {
    const data = await createPendingAdminImageUploads(files);

    return NextResponse.json({
      success: true,
      bucket: data.bucket,
      uploads: data.uploads,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Không tạo được liên kết upload ảnh.",
      },
      { status: 400 }
    );
  }
}
