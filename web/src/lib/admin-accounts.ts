import { getServers, getNations } from "@/lib/accounts";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NationOption, ServerOption } from "@/lib/types";

type RelationRecord =
  | {
      code?: string | null;
      name?: string | null;
    }
  | Array<{
      code?: string | null;
      name?: string | null;
    }>
  | null;

type AccountImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number | null;
};

export type AdminAccountListItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  installmentPrice: number | null;
  status: "available" | "reserved" | "sold" | "hidden";
  isFeatured: boolean;
  updatedAt: string | null;
  thumbnailUrl: string | null;
  serverName: string | null;
  nationName: string | null;
};

export type AdminAccountStatus = AdminAccountListItem["status"];

export type AdminAccountListFilters = {
  search?: string;
  status?: AdminAccountStatus;
  featured?: "featured" | "standard";
  serverId?: string;
  nationId?: string;
  sort?: "updated_desc" | "price_desc" | "price_asc" | "title_asc";
  page?: number;
  limit?: number;
};

export type AdminAccountListResult = {
  items: AdminAccountListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedFilters: Required<Pick<AdminAccountListFilters, "page" | "limit" | "sort">> &
    Omit<AdminAccountListFilters, "page" | "limit" | "sort">;
};

export type AdminAccountOverview = {
  total: number;
  featured: number;
  available: number;
  reserved: number;
  sold: number;
  hidden: number;
};

export type AdminAccountEditorRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  serverId: string;
  nationId: string | null;
  powerScore: number;
  level: number;
  vipLevel: number;
  price: number;
  installmentPrice: number | null;
  status: "available" | "reserved" | "sold" | "hidden";
  thumbnailUrl: string | null;
  highlights: string[];
  isFeatured: boolean;
  images: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
  }>;
};

export type AdminAccountFormOptions = {
  servers: ServerOption[];
  nations: NationOption[];
};

export type PendingAdminImageUpload = {
  path: string;
  token: string;
  publicUrl: string;
  sortOrder: number;
};

export type AdminAccountGalleryItemInput = {
  id?: string;
  path?: string;
  caption?: string | null;
  sortOrder: number;
  isThumbnail?: boolean;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function getRelationName(relation: RelationRecord) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation.name ?? null;
}

function isMissingInstallmentColumnError(message: string) {
  return (
    message.includes("installment_price") &&
    message.includes("does not exist")
  );
}

function mapAdminListItem(
  item: unknown
): AdminAccountListItem {
  const row = item as {
    id: string;
    slug: string;
    title: string;
    price: number | string;
    installment_price?: number | string | null;
    status: "available" | "reserved" | "sold" | "hidden";
    is_featured: boolean | null;
    updated_at: string | null;
    thumbnail_url: string | null;
    servers: RelationRecord;
    nations: RelationRecord;
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: toNumber(row.price),
    installmentPrice:
      row.installment_price == null ? null : toNumber(row.installment_price),
    status: row.status,
    isFeatured: Boolean(row.is_featured),
    updatedAt: row.updated_at,
    thumbnailUrl: row.thumbnail_url,
    serverName: getRelationName(row.servers),
    nationName: getRelationName(row.nations),
  };
}

function normalizeAdminSearch(value?: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.replace(/[%:,]/g, " ").trim() || undefined;
}

function normalizeAdminPagination(filters: AdminAccountListFilters) {
  const limit = Math.max(10, Math.min(filters.limit ?? 20, 100));
  const page = Math.max(1, filters.page ?? 1);

  return {
    page,
    limit,
    from: (page - 1) * limit,
    to: page * limit - 1,
  };
}

function normalizeAdminSort(sort?: AdminAccountListFilters["sort"]) {
  if (sort === "price_desc" || sort === "price_asc" || sort === "title_asc") {
    return sort;
  }

  return "updated_desc";
}

function getStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || "account-images";
}

export async function ensureStorageBucketExists() {
  const supabase = getSupabaseAdminClient();
  const bucket = getStorageBucketName();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const existingBucket = (buckets ?? []).find((item) => item.name === bucket);

  if (existingBucket) {
    return bucket;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "10MB",
  });

  if (createError) {
    throw new Error(createError.message);
  }

  return bucket;
}

const MAX_ADMIN_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ADMIN_IMAGE_COUNT = 20;

function sanitizeFileExtension(fileName: string, contentType?: string) {
  const extensionFromName = fileName.split(".").pop()?.toLowerCase() ?? "";
  const normalizedNameExtension = extensionFromName.replace(/[^a-z0-9]/g, "");

  if (normalizedNameExtension) {
    return normalizedNameExtension.slice(0, 10);
  }

  if (contentType?.startsWith("image/")) {
    const normalizedTypeExtension = contentType
      .slice("image/".length)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (normalizedTypeExtension) {
      return normalizedTypeExtension.slice(0, 10);
    }
  }

  return "jpg";
}

export async function createPendingAdminImageUploads(
  files: Array<{ name: string; type?: string; size: number }>
): Promise<{
  bucket: string;
  uploads: PendingAdminImageUpload[];
}> {
  if (files.length === 0) {
    return {
      bucket: await ensureStorageBucketExists(),
      uploads: [],
    };
  }

  if (files.length > MAX_ADMIN_IMAGE_COUNT) {
    throw new Error(`Chỉ được upload tối đa ${MAX_ADMIN_IMAGE_COUNT} ảnh mỗi lần.`);
  }

  const bucket = await ensureStorageBucketExists();
  const supabase = getSupabaseAdminClient();
  const batchId = `${Date.now()}-${crypto.randomUUID()}`;
  const uploads: PendingAdminImageUpload[] = [];

  for (const [index, file] of files.entries()) {
    if (file.size <= 0) {
      throw new Error(`Ảnh #${index + 1} không hợp lệ.`);
    }

    if (file.size > MAX_ADMIN_IMAGE_SIZE) {
      throw new Error(
        `Ảnh "${file.name || `#${index + 1}`}" vượt quá 10MB. Hãy nén nhỏ hơn rồi thử lại.`
      );
    }

    if (file.type && !file.type.startsWith("image/")) {
      throw new Error(`Tệp "${file.name || `#${index + 1}`}" không phải ảnh hợp lệ.`);
    }

    const extension = sanitizeFileExtension(file.name, file.type);
    const path = `accounts/uploads/${batchId}/${index + 1}.${extension}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      throw new Error(error?.message || "Không tạo được liên kết upload ảnh.");
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

    uploads.push({
      path,
      token: data.token,
      publicUrl: publicUrlData.publicUrl,
      sortOrder: index,
    });
  }

  return {
    bucket,
    uploads,
  };
}

function extractStoragePath(url: string, bucket: string) {
  try {
    const parsedUrl = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsedUrl.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function uploadImages(accountId: string, files: File[]) {
  const supabase = getSupabaseAdminClient();
  const bucket = await ensureStorageBucketExists();

  const uploadedImages: Array<{
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
  }> = [];

  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `accounts/${accountId}/${Date.now()}-${index}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: file.type || `image/${extension}`,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    uploadedImages.push({
      imageUrl: data.publicUrl,
      caption: null,
      sortOrder: index,
    });
  }

  return uploadedImages;
}

type StoredAccountImage = {
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

function normalizeGalleryCaption(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeGalleryItems(
  images: AdminAccountGalleryItemInput[]
): Array<{
  id?: string;
  path?: string;
  caption: string | null;
  sortOrder: number;
  isThumbnail: boolean;
}> {
  return images
    .map((image) => ({
      id: image.id?.trim() || undefined,
      path: image.path?.trim() || undefined,
      caption: normalizeGalleryCaption(image.caption),
      sortOrder: Number(image.sortOrder ?? 0),
      isThumbnail: Boolean(image.isThumbnail),
    }))
    .filter((image) => image.id || image.path)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image, index) => ({
      ...image,
      sortOrder: index,
    }));
}

async function syncStoredAccountImages(
  accountId: string,
  images: AdminAccountGalleryItemInput[]
) {
  const normalizedImages = normalizeGalleryItems(images);

  if (normalizedImages.length > MAX_ADMIN_IMAGE_COUNT) {
    throw new Error(`Chỉ được lưu tối đa ${MAX_ADMIN_IMAGE_COUNT} ảnh cho mỗi acc.`);
  }

  const supabase = getSupabaseAdminClient();
  const bucket = getStorageBucketName();
  const { data: existingImages, error: existingError } = await supabase
    .from("account_images")
    .select("id, image_url, caption, sort_order")
    .eq("account_id", accountId)
    .order("sort_order", { ascending: true });

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingImageRows = (existingImages ?? []) as AccountImageRow[];
  const existingImageMap = new Map(existingImageRows.map((image) => [image.id, image]));
  const keptExistingIds = new Set<string>();
  const imagesToInsert: Array<{
    account_id: string;
    image_url: string;
    caption: string | null;
    sort_order: number;
  }> = [];
  const finalImages: Array<StoredAccountImage & { isThumbnail: boolean }> = [];

  for (const image of normalizedImages) {
    if (image.id) {
      const existingImage = existingImageMap.get(image.id);

      if (!existingImage) {
        throw new Error("Danh sách ảnh đã cũ hoặc không hợp lệ. Hãy tải lại trang rồi thử lại.");
      }

      keptExistingIds.add(image.id);

      finalImages.push({
        imageUrl: existingImage.image_url,
        caption: image.caption,
        sortOrder: image.sortOrder,
        isThumbnail: image.isThumbnail,
      });

      const { error: updateImageError } = await supabase
        .from("account_images")
        .update({
          caption: image.caption,
          sort_order: image.sortOrder,
        })
        .eq("id", image.id);

      if (updateImageError) {
        throw new Error(updateImageError.message);
      }

      continue;
    }

    if (!image.path) {
      continue;
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(image.path).data.publicUrl;

    imagesToInsert.push({
      account_id: accountId,
      image_url: publicUrl,
      caption: image.caption,
      sort_order: image.sortOrder,
    });

    finalImages.push({
      imageUrl: publicUrl,
      caption: image.caption,
      sortOrder: image.sortOrder,
      isThumbnail: image.isThumbnail,
    });
  }

  const removedImages = existingImageRows.filter((image) => !keptExistingIds.has(image.id));

  if (removedImages.length > 0) {
    const { error: deleteRowsError } = await supabase
      .from("account_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));

    if (deleteRowsError) {
      throw new Error(deleteRowsError.message);
    }
  }

  if (imagesToInsert.length > 0) {
    const { error: insertImagesError } = await supabase
      .from("account_images")
      .insert(imagesToInsert);

    if (insertImagesError) {
      throw new Error(insertImagesError.message);
    }
  }

  const thumbnailImage =
    finalImages.find((image) => image.isThumbnail) ?? finalImages[0] ?? null;

  const { error: updateThumbnailError } = await supabase
    .from("accounts")
    .update({
      thumbnail_url: thumbnailImage?.imageUrl ?? null,
    })
    .eq("id", accountId);

  if (updateThumbnailError) {
    throw new Error(updateThumbnailError.message);
  }

  const oldPaths = removedImages
    .map((image) => extractStoragePath(image.image_url as string, bucket))
    .filter((path): path is string => Boolean(path));

  if (oldPaths.length > 0) {
    await supabase.storage.from(bucket).remove(oldPaths);
  }

  return finalImages.map((image) => ({
    imageUrl: image.imageUrl,
    caption: image.caption,
    sortOrder: image.sortOrder,
  }));
}

export async function getAdminAccountFormOptions(): Promise<AdminAccountFormOptions> {
  const [servers, nations] = await Promise.all([getServers(), getNations()]);

  return {
    servers,
    nations,
  };
}

export async function getAdminAccountsOverview(): Promise<AdminAccountOverview> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("status, is_featured");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<AdminAccountOverview>(
    (stats, item) => {
      const row = item as {
        status: AdminAccountStatus;
        is_featured: boolean | null;
      };

      stats.total += 1;

      if (row.is_featured) {
        stats.featured += 1;
      }

      stats[row.status] += 1;

      return stats;
    },
    {
      total: 0,
      featured: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      hidden: 0,
    }
  );
}

export async function getAdminAccountsList(
  filters: AdminAccountListFilters = {}
): Promise<AdminAccountListResult> {
  const { page, limit, from, to } = normalizeAdminPagination(filters);
  const search = normalizeAdminSearch(filters.search);
  const sort = normalizeAdminSort(filters.sort);
  const supabase = getSupabaseAdminClient();
  const buildQuery = (selectClause: string) => {
    let query = supabase
      .from("accounts")
      .select(selectClause, { count: "exact" });

    if (search) {
      query = query.or(`title.ilike.*${search}*,slug.ilike.*${search}*`);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.featured === "featured") {
      query = query.eq("is_featured", true);
    } else if (filters.featured === "standard") {
      query = query.eq("is_featured", false);
    }

    if (filters.serverId) {
      query = query.eq("server_id", filters.serverId);
    }

    if (filters.nationId) {
      query = query.eq("nation_id", filters.nationId);
    }

    if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "title_asc") {
      query = query.order("title", { ascending: true });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    return query.range(from, to);
  };

  const queryWithInstallment = `
      id,
      slug,
      title,
      price,
      installment_price,
      status,
      is_featured,
      updated_at,
      thumbnail_url,
      servers:server_id(name),
      nations:nation_id(name)
    `;
  const queryBase = queryWithInstallment.replace("      installment_price,\n", "");

  let { data, error, count } = await buildQuery(queryWithInstallment);

  if (error && isMissingInstallmentColumnError(error.message)) {
    ({ data, error, count } = await buildQuery(queryBase));
  }

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: ((data ?? []) as unknown[]).map(mapAdminListItem),
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    appliedFilters: {
      search,
      status: filters.status,
      featured: filters.featured,
      serverId: filters.serverId,
      nationId: filters.nationId,
      sort,
      page,
      limit,
    },
  };
}

export async function getAdminAccountById(
  id: string
): Promise<AdminAccountEditorRecord | null> {
  const supabase = getSupabaseAdminClient();
  const queryWithInstallment = `
      id,
      slug,
      title,
      description,
      server_id,
      nation_id,
      power_score,
      level,
      vip_level,
      price,
      installment_price,
      original_price,
      status,
      thumbnail_url,
      highlights,
      is_featured,
      account_images(id, image_url, caption, sort_order)
    `;
  const queryBase = queryWithInstallment.replace("      installment_price,\n", "");
  const buildQuery = (selectClause: string) =>
    supabase
      .from("accounts")
      .select(selectClause)
      .eq("id", id)
      .maybeSingle();

  let { data, error } = await buildQuery(queryWithInstallment);

  if (error && isMissingInstallmentColumnError(error.message)) {
    ({ data, error } = await buildQuery(queryBase));
  }

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    server_id: string;
    nation_id: string | null;
    power_score: number | null;
    level: number | null;
    vip_level: number | null;
    price: number | string;
    installment_price?: number | string | null;
    original_price: number | string | null;
    status: "available" | "reserved" | "sold" | "hidden";
    thumbnail_url: string | null;
    highlights: string[] | null;
    is_featured: boolean | null;
    account_images: AccountImageRow[] | null;
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    serverId: row.server_id,
    nationId: row.nation_id,
    powerScore: row.power_score ?? 0,
    level: row.level ?? 1,
    vipLevel: row.vip_level ?? 0,
    price: toNumber(row.price),
    installmentPrice:
      row.installment_price == null ? null : toNumber(row.installment_price),
    status: row.status,
    thumbnailUrl: row.thumbnail_url,
    highlights: row.highlights ?? [],
    isFeatured: Boolean(row.is_featured),
    images: (row.account_images ?? [])
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      .map((image) => ({
        id: image.id,
        imageUrl: image.image_url,
        caption: image.caption,
        sortOrder: image.sort_order ?? 0,
      })),
  };
}

export async function replaceAccountImages(accountId: string, files: File[]) {
  const uploadedImages = await uploadImages(accountId, files);
  return syncStoredAccountImages(
    accountId,
    uploadedImages.map((image, index) => ({
      path: extractStoragePath(image.imageUrl, getStorageBucketName()) || undefined,
      caption: image.caption,
      sortOrder: image.sortOrder,
      isThumbnail: index === 0,
    }))
  );
}

export async function syncAccountGallery(
  accountId: string,
  images: AdminAccountGalleryItemInput[]
) {
  return syncStoredAccountImages(accountId, images);
}

export async function replaceAccountImagesWithPendingUploads(
  accountId: string,
  uploads: PendingAdminImageUpload[]
) {
  return syncStoredAccountImages(
    accountId,
    uploads.map((upload, index) => ({
      path: upload.path,
      caption: null,
      sortOrder: upload.sortOrder,
      isThumbnail: index === 0,
    }))
  );
}
