import { NextResponse } from "next/server";
import { getSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase-admin";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { ContactMethod, ContactRequestPayload } from "@/lib/types";

const ALLOWED_METHODS = new Set<ContactMethod>([
  "zalo",
  "facebook",
  "phone",
  "form",
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeBody(body: unknown): ContactRequestPayload {
  const payload = (body ?? {}) as Record<string, unknown>;
  const customerName = normalizeText(payload.customer_name);
  const customerPhone = normalizeText(payload.customer_phone);
  const customerZalo = normalizeText(payload.customer_zalo);
  const message = normalizeText(payload.message);
  const accountId = normalizeText(payload.account_id);
  const contactMethod = normalizeText(payload.contact_method) as ContactMethod;

  return {
    account_id: accountId || undefined,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_zalo: customerZalo || undefined,
    contact_method: ALLOWED_METHODS.has(contactMethod) ? contactMethod : "zalo",
    message: message || undefined,
  };
}

function validatePayload(payload: ContactRequestPayload) {
  if (payload.account_id && !UUID_REGEX.test(payload.account_id)) {
    return "Mã tài khoản không hợp lệ.";
  }

  if (payload.customer_name.length < 2 || payload.customer_name.length > 120) {
    return "Tên liên hệ phải từ 2 đến 120 ký tự.";
  }

  const normalizedPhone = payload.customer_phone.replace(/[^\d+]/g, "");
  const phoneLength = normalizedPhone.replace(/\D/g, "").length;

  if (phoneLength < 8 || phoneLength > 15) {
    return "Số điện thoại không hợp lệ.";
  }

  if (payload.customer_zalo && payload.customer_zalo.length > 120) {
    return "Thông tin Zalo quá dài.";
  }

  if (payload.message && payload.message.length > 1000) {
    return "Tin nhắn không được vượt quá 1000 ký tự.";
  }

  return null;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: "Hệ thống liên hệ đang tạm gián đoạn. Vui lòng thử lại sau ít phút.",
      },
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu gửi lên không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const payload = normalizeBody(body);
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 }
    );
  }

  const supabase = hasSupabaseServiceRole()
    ? getSupabaseAdminClient()
    : getSupabaseServerClient();

  const { data, error } = await supabase
    .from("contact_requests")
    .insert({
      account_id: payload.account_id ?? null,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_zalo: payload.customer_zalo ?? null,
      contact_method: payload.contact_method ?? "zalo",
      message: payload.message ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Không thể gửi yêu cầu lúc này. Vui lòng thử lại hoặc liên hệ Zalo, Messenger để được hỗ trợ nhanh.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    id: data.id,
    message: "Đã ghi nhận yêu cầu. Shop sẽ liên hệ lại sớm.",
  });
}
