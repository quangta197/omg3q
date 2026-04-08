import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type AdminAccountGalleryItemInput,
  type PendingAdminImageUpload,
  replaceAccountImages,
  replaceAccountImagesWithPendingUploads,
  syncAccountGallery,
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

function parseGalleryState(formData: FormData) {
  if (!formData.has("gallery_state")) {
    return parsePendingUploads(formData).map((item, index) => ({
      path: item.path,
      caption: null,
      sortOrder: item.sortOrder,
      isThumbnail: index === 0,
    })) as AdminAccountGalleryItemInput[];
  }

  const raw = normalizeText(formData, "gallery_state");

  if (!raw) {
    return [] as AdminAccountGalleryItemInput[];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gallery ảnh không hợp lệ.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gallery ảnh không hợp lệ.");
  }

  const items = parsed.map((item) => {
    const row = item as Partial<AdminAccountGalleryItemInput>;
    const id = String(row.id || "").trim();
    const path = String(row.path || "").trim();
    const sortOrder = Number(row.sortOrder ?? 0);

    if (id && path) {
      throw new Error("Mỗi ảnh chỉ được là ảnh cũ hoặc ảnh mới.");
    }

    if (!id && !path) {
      throw new Error("Gallery ảnh có phần tử không hợp lệ.");
    }

    if (path && !path.startsWith("accounts/")) {
      throw new Error("Đường dẫn ảnh upload không hợp lệ.");
    }

    if (!Number.isFinite(sortOrder)) {
      throw new Error("Thứ tự ảnh không hợp lệ.");
    }

    return {
      ...(id ? { id } : {}),
      ...(path ? { path } : {}),
      caption: typeof row.caption === "string" ? row.caption : null,
      sortOrder,
      isThumbnail: Boolean(row.isThumbnail),
    } satisfies AdminAccountGalleryItemInput;
  });

  if (items.filter((item) => item.isThumbnail).length > 1) {
    throw new Error("Chỉ được chọn một ảnh đại diện.");
  }

  return items.sort((left, right) => left.sortOrder - right.sortOrder);
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

  const formData = await request.formData();
  const hasStructuredGallery = formData.has("gallery_state");
  let galleryState: AdminAccountGalleryItemInput[] = [];
  let uploadedImages: PendingAdminImageUpload[] = [];

  try {
    galleryState = parseGalleryState(formData);
    uploadedImages = hasStructuredGallery ? [] : parsePendingUploads(formData);
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
    .insert(payload)
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
    if (hasStructuredGallery || galleryState.length > 0) {
      await syncAccountGallery(data.id, galleryState);
    } else if (uploadedImages.length > 0) {
      await replaceAccountImagesWithPendingUploads(data.id, uploadedImages);
    } else if (files.length > 0) {
      await replaceAccountImages(data.id, files);
    }
  } catch (imageError) {
    return NextResponse.json(
      {
        success: false,
        message:
          imageError instanceof Error
            ? imageError.message
            : "Tạo acc thành công nhưng upload ảnh thất bại.",
      },
      { status: 500 }
    );
  }

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${data.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/accounts");

  return NextResponse.json({
    success: true,
    id: data.id,
    slug: data.slug,
  });
}
