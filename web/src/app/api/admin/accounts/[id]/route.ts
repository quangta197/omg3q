import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type PendingAdminImageUpload,
  getAdminAccountById,
  replaceAccountImages,
  replaceAccountImagesWithPendingUploads,
} from "@/lib/admin-accounts";
import { authorizeAdminApiRequest } from "@/lib/admin-session";
import { getSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase-admin";

function normalizeText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function normalizeNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function normalizeOptionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function parseHighlights(raw: string) {
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePendingUploads(formData: FormData) {
  const raw = normalizeText(formData, "uploaded_images");

  if (!raw) {
    return [] as PendingAdminImageUpload[];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Danh sách ảnh upload không hợp lệ.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Danh sách ảnh upload không hợp lệ.");
  }

  return parsed
    .map((item) => {
      const row = item as Partial<PendingAdminImageUpload>;

      return {
        path: String(row.path || "").trim(),
        token: String(row.token || "").trim(),
        publicUrl: String(row.publicUrl || "").trim(),
        sortOrder: Number(row.sortOrder ?? 0),
      };
    })
    .filter(
      (item) =>
        item.path.startsWith("accounts/") &&
        Number.isFinite(item.sortOrder)
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function validatePayload(formData: FormData) {
  const title = normalizeText(formData, "title");
  const slug = normalizeText(formData, "slug");
  const serverId = normalizeText(formData, "server_id");
  const price = normalizeNumber(formData, "price");
  const installmentRaw = normalizeText(formData, "installment_price");
  const installmentPrice = normalizeOptionalNumber(formData, "installment_price");

  if (title.length < 4) {
    return "Tiêu đề phải từ 4 ký tự.";
  }

  if (slug.length < 4) {
    return "Slug phải từ 4 ký tự.";
  }

  if (!serverId) {
    return "Bạn cần chọn server.";
  }

  if (price <= 0) {
    return "Giá bán phải lớn hơn 0.";
  }

  if (installmentRaw && installmentPrice === null) {
    return "Giá góp phải lớn hơn 0.";
  }

  return null;
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

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
        message: "Không tìm thấy tài khoản cần sửa.",
      },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  let uploadedImages: PendingAdminImageUpload[] = [];

  try {
    uploadedImages = parsePendingUploads(formData);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Danh sách ảnh upload không hợp lệ.",
      },
      { status: 400 }
    );
  }

  const validationError = validatePayload(formData);

  if (validationError) {
    return NextResponse.json(
      {
        success: false,
        message: validationError,
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient();
  const title = normalizeText(formData, "title");
  const slug = normalizeText(formData, "slug");
  const description = normalizeText(formData, "description");
  const serverId = normalizeText(formData, "server_id");
  const nationId = normalizeText(formData, "nation_id");
  const status = normalizeText(formData, "status") || "available";
  const installmentPrice = normalizeOptionalNumber(formData, "installment_price");
  const highlights = parseHighlights(normalizeText(formData, "highlights"));
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const payload = {
    title,
    slug,
    description: description || null,
    server_id: serverId,
    nation_id: nationId || null,
    price: normalizeNumber(formData, "price"),
    power_score: normalizeNumber(formData, "power_score"),
    level: normalizeNumber(formData, "level", 1),
    vip_level: normalizeNumber(formData, "vip_level"),
    status,
    is_featured: formData.get("is_featured") === "on",
    highlights,
    ...(installmentPrice !== null
      ? { installment_price: installmentPrice }
      : {}),
  };

  const { data, error } = await supabase
    .from("accounts")
    .update(payload)
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    if (
      error.message.includes("installment_price") &&
      error.message.includes("does not exist")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database chưa có cột installment_price. Hãy chạy SQL migration trước khi dùng giá góp.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }

  try {
    if (uploadedImages.length > 0) {
      await replaceAccountImagesWithPendingUploads(id, uploadedImages);
    } else if (files.length > 0) {
      await replaceAccountImages(id, files);
    }
  } catch (imageError) {
    return NextResponse.json(
      {
        success: false,
        message:
          imageError instanceof Error
            ? imageError.message
            : "Cập nhật nick thành công nhưng upload ảnh thất bại.",
      },
      { status: 500 }
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
  });
}
