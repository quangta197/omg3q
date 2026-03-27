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
  status: "available" | "reserved" | "sold" | "hidden";
  isFeatured: boolean;
  updatedAt: string | null;
  thumbnailUrl: string | null;
  serverName: string | null;
  nationName: string | null;
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
  originalPrice: number | null;
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

function getStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || "account-images";
}

async function ensureStorageBucketExists() {
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

export async function getAdminAccountFormOptions(): Promise<AdminAccountFormOptions> {
  const [servers, nations] = await Promise.all([getServers(), getNations()]);

  return {
    servers,
    nations,
  };
}

export async function getAdminAccountsList(): Promise<AdminAccountListItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(`
      id,
      slug,
      title,
      price,
      status,
      is_featured,
      updated_at,
      thumbnail_url,
      servers:server_id(name),
      nations:nation_id(name)
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => {
    const row = item as {
      id: string;
      slug: string;
      title: string;
      price: number | string;
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
      status: row.status,
      isFeatured: Boolean(row.is_featured),
      updatedAt: row.updated_at,
      thumbnailUrl: row.thumbnail_url,
      serverName: getRelationName(row.servers),
      nationName: getRelationName(row.nations),
    };
  });
}

export async function getAdminAccountById(
  id: string
): Promise<AdminAccountEditorRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(`
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
      original_price,
      status,
      thumbnail_url,
      highlights,
      is_featured,
      account_images(id, image_url, caption, sort_order)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as {
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
    originalPrice:
      row.original_price === null ? null : toNumber(row.original_price),
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

  const uploadedImages = await uploadImages(accountId, files);

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
