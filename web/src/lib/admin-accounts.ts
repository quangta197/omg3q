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

async function replaceStoredAccountImages(
  accountId: string,
  uploadedImages: StoredAccountImage[]
) {
  const supabase = getSupabaseAdminClient();
  const bucket = getStorageBucketName();
  const { data: existingImages, error: existingError } = await supabase
    .from("account_images")
    .select("id, image_url")
    .eq("account_id", accountId)
    .order("sort_order", { ascending: true });

  if (existingError) {
    throw new Error(existingError.message);
  }

  const { error: deleteRowsError } = await supabase
    .from("account_images")
    .delete()
    .eq("account_id", accountId);

  if (deleteRowsError) {
    throw new Error(deleteRowsError.message);
  }

  if (uploadedImages.length > 0) {
    const { error: insertImagesError } = await supabase
      .from("account_images")
      .insert(
        uploadedImages.map((image) => ({
          account_id: accountId,
          image_url: image.imageUrl,
          caption: image.caption,
          sort_order: image.sortOrder,
        }))
      );

    if (insertImagesError) {
      throw new Error(insertImagesError.message);
    }
  }

  const { error: updateThumbnailError } = await supabase
    .from("accounts")
    .update({
      thumbnail_url: uploadedImages[0]?.imageUrl ?? null,
    })
    .eq("id", accountId);

  if (updateThumbnailError) {
    throw new Error(updateThumbnailError.message);
  }

  const oldPaths = (existingImages ?? [])
    .map((image) => extractStoragePath(image.image_url as string, bucket))
    .filter((path): path is string => Boolean(path));

  if (oldPaths.length > 0) {
    await supabase.storage.from(bucket).remove(oldPaths);
  }

  return uploadedImages;
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
  return replaceStoredAccountImages(accountId, uploadedImages);
}

export async function replaceAccountImagesWithPendingUploads(
  accountId: string,
  uploads: PendingAdminImageUpload[]
) {
  const bucket = getStorageBucketName();
  const supabase = getSupabaseAdminClient();

  return replaceStoredAccountImages(
    accountId,
    uploads.map((upload) => ({
      imageUrl: supabase.storage.from(bucket).getPublicUrl(upload.path).data.publicUrl,
      caption: null,
      sortOrder: upload.sortOrder,
    }))
  );
}
