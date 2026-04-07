import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { type AdminAccountStatus, getAdminAccountById } from "@/lib/admin-accounts";
import { authorizeAdminApiRequest } from "@/lib/admin-session";
import { getSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase-admin";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function isValidStatus(value: unknown): value is AdminAccountStatus {
  return (
    value === "available" ||
    value === "reserved" ||
    value === "sold" ||
    value === "hidden"
  );
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
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

  const { id } = await params;
  const currentAccount = await getAdminAccountById(id);

  if (!currentAccount) {
    return NextResponse.json(
      {
        success: false,
        message: "Không tìm thấy tài khoản cần cập nhật.",
      },
      { status: 404 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu cập nhật trạng thái không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const nextStatus =
    payload && typeof payload === "object" && "status" in payload
      ? (payload.status as unknown)
      : undefined;

  if (!isValidStatus(nextStatus)) {
    return NextResponse.json(
      {
        success: false,
        message: "Trạng thái cần cập nhật không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${currentAccount.slug}`);
  revalidatePath(`/accounts/${data.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${id}`);

  return NextResponse.json({
    success: true,
    id: data.id,
    slug: data.slug,
    status: data.status,
  });
}
