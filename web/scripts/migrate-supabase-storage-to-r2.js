/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function encodeObjectPath(objectPath) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

function getR2PublicUrl(objectPath) {
  return `${trimTrailingSlash(requireEnv("CLOUDFLARE_R2_PUBLIC_URL"))}/${encodeObjectPath(
    objectPath
  )}`;
}

function extractSupabaseStoragePath(url, bucket) {
  if (!url) {
    return null;
  }

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

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));

  return {
    apply: args.has("--apply"),
    deleteSource: args.has("--delete-source"),
    limit: limitArg ? Number(limitArg.split("=")[1]) : Infinity,
  };
}

function getContentType(objectPath) {
  const extension = objectPath.split(".").pop()?.toLowerCase();

  if (extension === "webp") return "image/webp";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "gif") return "image/gif";

  return "application/octet-stream";
}

function buildR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("CLOUDFLARE_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function fetchReferencedImages(supabase, bucket) {
  const [imagesResult, accountsResult] = await Promise.all([
    supabase.from("account_images").select("id,image_url"),
    supabase.from("accounts").select("id,thumbnail_url"),
  ]);

  if (imagesResult.error) throw imagesResult.error;
  if (accountsResult.error) throw accountsResult.error;

  const references = new Map();

  function addReference(storagePath, reference) {
    if (!storagePath) {
      return;
    }

    const current = references.get(storagePath) || {
      path: storagePath,
      accountImageIds: [],
      accountThumbnailIds: [],
    };

    if (reference.type === "account_image") {
      current.accountImageIds.push(reference.id);
    } else {
      current.accountThumbnailIds.push(reference.id);
    }

    references.set(storagePath, current);
  }

  for (const row of imagesResult.data || []) {
    addReference(extractSupabaseStoragePath(row.image_url, bucket), {
      type: "account_image",
      id: row.id,
    });
  }

  for (const row of accountsResult.data || []) {
    addReference(extractSupabaseStoragePath(row.thumbnail_url, bucket), {
      type: "account_thumbnail",
      id: row.id,
    });
  }

  return Array.from(references.values());
}

async function updateReferences(supabase, reference, publicUrl) {
  if (reference.accountImageIds.length > 0) {
    const { error } = await supabase
      .from("account_images")
      .update({ image_url: publicUrl })
      .in("id", reference.accountImageIds);

    if (error) throw error;
  }

  if (reference.accountThumbnailIds.length > 0) {
    const { error } = await supabase
      .from("accounts")
      .update({ thumbnail_url: publicUrl })
      .in("id", reference.accountThumbnailIds);

    if (error) throw error;
  }
}

async function main() {
  loadEnv(path.join(process.cwd(), ".env.local"));

  const options = parseArgs();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "account-images";
  const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET || process.env.R2_BUCKET_NAME;

  if (!r2Bucket) {
    throw new Error("Missing CLOUDFLARE_R2_BUCKET or R2_BUCKET_NAME.");
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const r2 = buildR2Client();
  const references = (await fetchReferencedImages(supabase, bucket)).slice(0, options.limit);
  let uploaded = 0;
  let updated = 0;
  let deleted = 0;

  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : "dry-run",
        deleteSource: options.deleteSource,
        sourceBucket: bucket,
        r2Bucket,
        referencedObjects: references.length,
      },
      null,
      2
    )
  );

  for (const [index, reference] of references.entries()) {
    const publicUrl = getR2PublicUrl(reference.path);

    if (!options.apply) {
      console.log(`[dry-run] ${index + 1}/${references.length} ${reference.path} -> ${publicUrl}`);
      continue;
    }

    const { data, error } = await supabase.storage.from(bucket).download(reference.path);

    if (error || !data) {
      throw error || new Error(`Cannot download ${reference.path}`);
    }

    await r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: reference.path,
        Body: Buffer.from(await data.arrayBuffer()),
        ContentType: getContentType(reference.path),
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    uploaded += 1;

    await updateReferences(supabase, reference, publicUrl);
    updated += reference.accountImageIds.length + reference.accountThumbnailIds.length;

    if (options.deleteSource) {
      const { error: deleteError } = await supabase.storage.from(bucket).remove([reference.path]);
      if (deleteError) throw deleteError;
      deleted += 1;
    }

    if ((index + 1) % 25 === 0 || index + 1 === references.length) {
      console.log(`Processed ${index + 1}/${references.length}`);
    }
  }

  console.log(JSON.stringify({ uploaded, updated, deleted }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
