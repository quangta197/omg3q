import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const STORAGE_IMAGE_CACHE_CONTROL_SECONDS = "31536000";

type ObjectStorageProvider = "supabase" | "r2";

let r2Client: S3Client | null = null;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function getObjectStorageProvider(): ObjectStorageProvider {
  return process.env.OBJECT_STORAGE_PROVIDER === "r2" ? "r2" : "supabase";
}

export function isR2StorageEnabled() {
  return getObjectStorageProvider() === "r2";
}

export function getR2BucketName() {
  return (
    process.env.CLOUDFLARE_R2_BUCKET ||
    process.env.R2_BUCKET_NAME ||
    process.env.SUPABASE_STORAGE_BUCKET ||
    "account-images"
  );
}

export function getR2PublicUrl(objectPath: string) {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("Missing CLOUDFLARE_R2_PUBLIC_URL.");
  }

  return `${trimTrailingSlash(publicUrl)}/${encodeObjectPath(objectPath)}`;
}

export function assertR2Configured() {
  const missing = [
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_PUBLIC_URL",
  ].filter((name) => !process.env[name]);

  if (!getR2BucketName()) {
    missing.push("CLOUDFLARE_R2_BUCKET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missing.join(", ")}.`);
  }
}

function getR2Client() {
  assertR2Configured();

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY as string,
      },
    });
  }

  return r2Client;
}

export async function uploadR2Object({
  path,
  body,
  contentType,
}: {
  path: string;
  body: Buffer;
  contentType?: string;
}) {
  const bucket = getR2BucketName();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: body,
      ContentType: contentType || "application/octet-stream",
      CacheControl: `public, max-age=${STORAGE_IMAGE_CACHE_CONTROL_SECONDS}, immutable`,
    })
  );

  return {
    bucket,
    path,
    publicUrl: getR2PublicUrl(path),
  };
}

export async function removeR2Objects(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const bucket = getR2BucketName();

  await getR2Client().send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: paths.map((path) => ({ Key: path })),
        Quiet: true,
      },
    })
  );
}

export function extractSupabaseStoragePath(url: string, bucket: string) {
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

export function extractR2ObjectPath(url: string) {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!publicUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const parsedPublicUrl = new URL(publicUrl);

    if (parsedUrl.origin !== parsedPublicUrl.origin) {
      return null;
    }

    const publicPath = trimTrailingSlash(parsedPublicUrl.pathname);
    const objectPath = parsedUrl.pathname.slice(publicPath.length).replace(/^\/+/, "");

    return objectPath ? decodeURIComponent(objectPath) : null;
  } catch {
    return null;
  }
}
