"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import type { NationOption, ServerOption } from "@/lib/types";
import styles from "./AccountForm.module.css";

type ExistingImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

type PendingUploadTicket = {
  path: string;
  token: string;
  publicUrl: string;
  sortOrder: number;
};

type GalleryImageItem = {
  clientId: string;
  existingId?: string;
  imageUrl: string;
  caption: string | null;
  file?: File;
};

type InitialAccountValues = {
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
  images: ExistingImage[];
};

type AccountFormProps = {
  mode: "create" | "edit";
  accountId?: string;
  initialValues?: InitialAccountValues;
  servers: ServerOption[];
  nations: NationOption[];
};

const MAX_GALLERY_IMAGE_COUNT = 20;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const TUS_RETRY_DELAYS = [0, 1500, 4000, 8000, 15000];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createGalleryClientId() {
  return `gallery-${crypto.randomUUID()}`;
}

function buildInitialGalleryState(initialValues?: InitialAccountValues) {
  const items = (initialValues?.images ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => ({
      clientId: createGalleryClientId(),
      existingId: image.id,
      imageUrl: image.imageUrl,
      caption: image.caption,
    }));

  const thumbnailId =
    items.find((item) => item.imageUrl === initialValues?.thumbnailUrl)?.clientId ??
    items[0]?.clientId ??
    null;

  return {
    items,
    thumbnailId,
  };
}

function isNewGalleryImage(
  item: GalleryImageItem
): item is GalleryImageItem & { file: File } {
  return item.file instanceof File;
}

function getSupabaseResumableUploadEndpoint() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL để upload ảnh.");
  }

  const projectUrl = new URL(url);
  const directStorageHost = projectUrl.hostname.includes(".storage.")
    ? projectUrl.hostname
    : projectUrl.hostname.replace(/\.supabase\.co$/i, ".storage.supabase.co");

  return `${projectUrl.protocol}//${directStorageHost}/storage/v1/upload/resumable`;
}

async function uploadFileWithTus(
  endpoint: string,
  bucket: string,
  ticket: PendingUploadTicket,
  file: File,
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: TUS_RETRY_DELAYS,
      headers: {
        "x-signature": ticket.token,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: bucket,
        objectName: ticket.path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress(bytesUploaded, bytesTotal);
      },
      onSuccess() {
        resolve();
      },
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getSubmitErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Không thể lưu tài khoản.";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    error instanceof TypeError ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("failed to upload chunk") ||
    normalizedMessage.includes("upload creation failed") ||
    normalizedMessage.includes("network request failed") ||
    normalizedMessage.includes("networkerror")
  ) {
    return "Kết nối upload bị gián đoạn trên mạng di động. Hãy thử lại, hệ thống sẽ dùng resumable upload để tiếp tục ổn định hơn.";
  }

  return error.message;
}

function IconArrowUp() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 4.25 4.25 10h3.5v5.75h4.5V10h3.5L10 4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.75 4.25H12.25V10H15.75L10 15.75 4.25 10h3.5V4.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M7.5 2.75h5l.75 1.5H16A.75.75 0 1 1 16 5.75h-.65l-.6 9.15A2 2 0 0 1 12.75 16.75h-5.5a2 2 0 0 1-1.99-1.85l-.61-9.15H4A.75.75 0 0 1 4 4.25h2.75l.75-1.5Zm-1.34 3L6.75 14a.5.5 0 0 0 .5.47h5.5a.5.5 0 0 0 .5-.47l.59-8.25H6.16ZM8 7.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V8.5A.75.75 0 0 1 8 7.75Zm4 .75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m10 2.7 2.15 4.35 4.8.7-3.47 3.39.82 4.78L10 13.62 5.7 15.92l.82-4.78L3.05 7.75l4.8-.7L10 2.7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AccountForm({
  mode,
  accountId,
  initialValues,
  servers,
  nations,
}: AccountFormProps) {
  const router = useRouter();
  const initialGallery = useMemo(
    () => buildInitialGalleryState(initialValues),
    [initialValues]
  );
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const [galleryItems, setGalleryItems] = useState<GalleryImageItem[]>(initialGallery.items);
  const [thumbnailImageId, setThumbnailImageId] = useState<string | null>(
    initialGallery.thumbnailId
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setGalleryItems(initialGallery.items);
    setThumbnailImageId(initialGallery.thumbnailId);
  }, [initialGallery]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;

    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }

      previewUrls.clear();
    };
  }, []);

  const serverOptions: SearchableSelectOption[] = servers.map((server) => ({
    value: server.id,
    label: server.name,
    keywords: [server.code, server.name],
  }));

  const activeThumbnailImageId =
    thumbnailImageId && galleryItems.some((item) => item.clientId === thumbnailImageId)
      ? thumbnailImageId
      : galleryItems[0]?.clientId ?? null;

  function revokePreviewUrl(image: GalleryImageItem | undefined) {
    if (!image || !image.file || !previewUrlsRef.current.has(image.imageUrl)) {
      return;
    }

    URL.revokeObjectURL(image.imageUrl);
    previewUrlsRef.current.delete(image.imageUrl);
  }

  async function uploadImagesDirectly(items: Array<GalleryImageItem & { file: File }>) {
    if (items.length === 0) {
      return new Map<string, PendingUploadTicket>();
    }

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: items.map((item) => ({
          name: item.file.name,
          type: item.file.type,
          size: item.file.size,
        })),
      }),
    });

    const data = (await response.json()) as {
      success?: boolean;
      bucket?: string;
      uploads?: PendingUploadTicket[];
      message?: string;
    };

    if (!response.ok || !data.success || !data.bucket || !data.uploads) {
      throw new Error(data.message || "Không tạo được phiên upload ảnh.");
    }

    if (data.uploads.length !== items.length) {
      throw new Error("Số lượng ảnh upload không khớp với dữ liệu đã chọn.");
    }

    const endpoint = getSupabaseResumableUploadEndpoint();
    const bucket = data.bucket;
    const uploadedImages = new Map<string, PendingUploadTicket>();

    for (const [index, item] of items.entries()) {
      setMessage(`Đang upload ảnh ${index + 1}/${items.length}...`);

      const target = data.uploads[index];
      await uploadFileWithTus(endpoint, bucket, target, item.file, (bytesUploaded, bytesTotal) => {
        const progress = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
        setMessage(`Đang upload ảnh ${index + 1}/${items.length} (${progress}%)...`);
      });

      uploadedImages.set(item.clientId, target);
    }

    return uploadedImages;
  }

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []).filter((file) => file.size > 0);
    event.currentTarget.value = "";

    if (files.length === 0) {
      return;
    }

    setMessage("");
    setError("");

    setGalleryItems((currentItems) => {
      if (currentItems.length + files.length > MAX_GALLERY_IMAGE_COUNT) {
        setError(`Tối đa ${MAX_GALLERY_IMAGE_COUNT} ảnh cho mỗi nick.`);
        return currentItems;
      }

      const appendedItems = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);

        return {
          clientId: createGalleryClientId(),
          imageUrl: previewUrl,
          caption: null,
          file,
        } satisfies GalleryImageItem;
      });

      const nextItems = [...currentItems, ...appendedItems];

      setThumbnailImageId((currentThumbnailId) => {
        if (currentThumbnailId && nextItems.some((item) => item.clientId === currentThumbnailId)) {
          return currentThumbnailId;
        }

        return nextItems[0]?.clientId ?? null;
      });

      return nextItems;
    });
  }

  function handleRemoveImage(clientId: string) {
    setMessage("");
    setError("");

    setGalleryItems((currentItems) => {
      const removedImage = currentItems.find((item) => item.clientId === clientId);
      const nextItems = currentItems.filter((item) => item.clientId !== clientId);
      revokePreviewUrl(removedImage);

      setThumbnailImageId((currentThumbnailId) => {
        if (
          currentThumbnailId &&
          currentThumbnailId !== clientId &&
          nextItems.some((item) => item.clientId === currentThumbnailId)
        ) {
          return currentThumbnailId;
        }

        return nextItems[0]?.clientId ?? null;
      });

      return nextItems;
    });
  }

  function handleMoveImage(clientId: string, direction: -1 | 1) {
    setGalleryItems((currentItems) => {
      const currentIndex = currentItems.findIndex((item) => item.clientId === clientId);
      const nextIndex = currentIndex + direction;

      if (
        currentIndex === -1 ||
        nextIndex < 0 ||
        nextIndex >= currentItems.length
      ) {
        return currentItems;
      }

      const nextItems = currentItems.slice();
      const [movedImage] = nextItems.splice(currentIndex, 1);
      nextItems.splice(nextIndex, 0, movedImage);

      return nextItems;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const serverId = String(formData.get("server_id") || "").trim();

    if (!serverId) {
      setError("Bạn cần chọn server từ danh sách gợi ý.");
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const newGalleryItems = galleryItems.filter(isNewGalleryImage);
      const uploadedImages = await uploadImagesDirectly(newGalleryItems);

      const galleryState = galleryItems.map((item, index) => {
        if (item.existingId) {
          return {
            id: item.existingId,
            caption: item.caption,
            sortOrder: index,
            isThumbnail: item.clientId === activeThumbnailImageId,
          };
        }

        const uploadedImage = uploadedImages.get(item.clientId);

        if (!uploadedImage) {
          throw new Error("Có ảnh mới chưa upload xong. Hãy thử lại.");
        }

        return {
          path: uploadedImage.path,
          caption: item.caption,
          sortOrder: index,
          isThumbnail: item.clientId === activeThumbnailImageId,
        };
      });

      formData.delete("images");
      formData.delete("uploaded_images");
      formData.set("gallery_state", JSON.stringify(galleryState));

      const response = await fetch(
        mode === "create" ? "/api/admin/accounts" : `/api/admin/accounts/${accountId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          body: formData,
        }
      );

      const data = (await response.json()) as {
        success?: boolean;
        id?: string;
        message?: string;
      };

      if (!response.ok || !data.success || !data.id) {
        throw new Error(data.message || "Không thể lưu tài khoản.");
      }

      setMessage(mode === "create" ? "Đã tạo tài khoản mới." : "Đã cập nhật tài khoản.");
      router.push(`/admin/accounts/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setMessage("");
      setError(getSubmitErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAutoSlug(event: React.FocusEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;

    if (!form) {
      return;
    }

    const slugInput = form.elements.namedItem("slug") as HTMLInputElement | null;

    if (!slugInput || slugInput.value.trim()) {
      return;
    }

    slugInput.value = slugify(event.currentTarget.value);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label className={styles.fieldWide}>
          <span className={styles.label}>Tiêu đề</span>
          <input
            className={styles.input}
            name="title"
            defaultValue={initialValues?.title ?? ""}
            onBlur={handleAutoSlug}
            required
          />
        </label>

        <label>
          <span className={styles.label}>Slug</span>
          <input
            className={styles.input}
            name="slug"
            defaultValue={initialValues?.slug ?? ""}
            required
          />
        </label>

        <label>
          <span className={styles.label}>Server</span>
          <SearchableSelect
            key={initialValues?.serverId ?? "server-empty"}
            id="server_id"
            name="server_id"
            defaultValue={initialValues?.serverId ?? ""}
            options={serverOptions}
            placeholder="Gõ tên hoặc mã server như S930"
            ariaLabel="Chọn server"
            inputClassName={styles.select}
          />
        </label>

        <label>
          <span className={styles.label}>Quốc gia</span>
          <select
            className={styles.select}
            name="nation_id"
            defaultValue={initialValues?.nationId ?? ""}
          >
            <option value="">Không chọn</option>
            {nations.map((nation) => (
              <option key={nation.id} value={nation.id}>
                {nation.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={styles.label}>Giá bán</span>
          <FormattedNumberInput
            className={styles.input}
            name="price"
            defaultValue={initialValues?.price ?? null}
            ariaLabel="Giá bán"
            required
          />
        </label>

        <label>
          <span className={styles.label}>Giá góp tham khảo</span>
          <FormattedNumberInput
            className={styles.input}
            name="installment_price"
            defaultValue={initialValues?.installmentPrice ?? null}
            ariaLabel="Giá góp tham khảo"
          />
        </label>

        <input
          type="hidden"
          name="power_score"
          value={String(initialValues?.powerScore ?? 0)}
          readOnly
        />

        <label>
          <span className={styles.label}>Level</span>
          <FormattedNumberInput
            className={styles.input}
            name="level"
            defaultValue={initialValues?.level ?? 1}
            ariaLabel="Level"
            required
          />
        </label>

        <label>
          <span className={styles.label}>VIP</span>
          <FormattedNumberInput
            className={styles.input}
            name="vip_level"
            defaultValue={initialValues?.vipLevel ?? 0}
            ariaLabel="VIP"
            required
          />
        </label>

        <label>
          <span className={styles.label}>Trạng thái</span>
          <select
            className={styles.select}
            name="status"
            defaultValue={initialValues?.status ?? "available"}
          >
            <option value="available">Đang bán</option>
            <option value="reserved">Đang giữ</option>
            <option value="sold">Đã bán</option>
            <option value="hidden">Ẩn</option>
          </select>
        </label>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={initialValues?.isFeatured ?? false}
          />
          <span>Đánh dấu nổi bật</span>
        </label>
      </div>

      <label>
        <span className={styles.label}>Highlights</span>
        <textarea
          className={styles.textarea}
          name="highlights"
          rows={4}
          defaultValue={initialValues?.highlights.join("\n") ?? ""}
          placeholder="Mỗi highlight một dòng hoặc ngăn cách bằng dấu phẩy"
        />
      </label>

      <label>
        <span className={styles.label}>Mô tả</span>
        <textarea
          className={styles.textarea}
          name="description"
          rows={6}
          defaultValue={initialValues?.description ?? ""}
        />
      </label>

      <label>
        <span className={styles.label}>Ảnh gallery</span>
        <input
          className={styles.input}
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelection}
          disabled={isSubmitting}
        />
        <span className={styles.helper}>
          Thêm ảnh mới sẽ nối vào gallery hiện tại. Bạn có thể xóa từng ảnh, đổi thứ tự,
          chọn ảnh đại diện riêng và giữ toàn bộ ảnh cũ nếu không muốn thay thế.
        </span>
        <span className={styles.helper}>
          Đang có {galleryItems.length}/{MAX_GALLERY_IMAGE_COUNT} ảnh. Mỗi ảnh nên dưới 10MB
          để upload ổn định trên điện thoại.
        </span>
      </label>

      {galleryItems.length > 0 ? (
        <div className={styles.previewGrid}>
          {galleryItems.map((image, index) => {
            const isThumbnail = image.clientId === activeThumbnailImageId;

            return (
              <article
                key={image.clientId}
                className={`${styles.previewCard} ${
                  isThumbnail ? styles.previewCardActive : ""
                }`}
              >
                <div className={styles.previewMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.imageUrl} alt="" className={styles.previewImage} />
                  <div className={styles.previewBadges}>
                    <span className={styles.orderBadge}>Ảnh #{index + 1}</span>
                    {image.file ? <span className={styles.newBadge}>Mới</span> : null}
                  </div>
                  {isThumbnail ? (
                    <span className={styles.thumbnailBadge}>Ảnh đại diện</span>
                  ) : null}
                </div>

                <div className={styles.previewFooter}>
                  <div className={styles.iconActions}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => handleMoveImage(image.clientId, -1)}
                      disabled={isSubmitting || index === 0}
                      aria-label={`Đưa ảnh #${index + 1} lên trước`}
                      title="Đưa lên trước"
                    >
                      <IconArrowUp />
                    </button>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => handleMoveImage(image.clientId, 1)}
                      disabled={isSubmitting || index === galleryItems.length - 1}
                      aria-label={`Đưa ảnh #${index + 1} xuống sau`}
                      title="Đưa xuống sau"
                    >
                      <IconArrowDown />
                    </button>
                    <button
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                      type="button"
                      onClick={() => handleRemoveImage(image.clientId)}
                      disabled={isSubmitting}
                      aria-label={`Xóa ảnh #${index + 1}`}
                      title="Xóa ảnh"
                    >
                      <IconTrash />
                    </button>
                  </div>

                  <button
                    className={`${styles.thumbnailButton} ${
                      isThumbnail ? styles.thumbnailButtonActive : ""
                    }`}
                    type="button"
                    onClick={() => setThumbnailImageId(image.clientId)}
                    disabled={isSubmitting || isThumbnail}
                  >
                    <IconStar filled={isThumbnail} />
                    <span>{isThumbnail ? "Đang là thumbnail" : "Chọn làm thumbnail"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyGallery}>
          Chưa có ảnh nào. Hãy thêm vài ảnh để khách xem được gallery và ảnh đại diện.
        </div>
      )}

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.actions}>
        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Đang lưu..."
            : mode === "create"
              ? "Tạo tài khoản"
              : "Lưu thay đổi"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => router.push("/admin/accounts")}
        >
          Quay lại danh sách
        </button>
      </div>
    </form>
  );
}
