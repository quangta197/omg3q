"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

type AccountFormProps = {
  mode: "create" | "edit";
  accountId?: string;
  initialValues?: {
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
    highlights: string[];
    isFeatured: boolean;
    images: ExistingImage[];
  };
  servers: ServerOption[];
  nations: NationOption[];
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Thiếu cấu hình Supabase public để upload ảnh.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function AccountForm({
  mode,
  accountId,
  initialValues,
  servers,
  nations,
}: AccountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const serverOptions: SearchableSelectOption[] = servers.map((server) => ({
    value: server.id,
    label: server.name,
    keywords: [server.code, server.name],
  }));

  async function uploadImagesDirectly(files: File[]) {
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: files.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
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

    if (data.uploads.length !== files.length) {
      throw new Error("Số lượng ảnh upload không khớp với dữ liệu đã chọn.");
    }

    const supabase = getBrowserSupabaseClient();
    const uploadedImages: PendingUploadTicket[] = [];

    for (const [index, file] of files.entries()) {
      setMessage(`Đang upload ảnh ${index + 1}/${files.length}...`);

      const target = data.uploads[index];
      const { error: uploadError } = await supabase.storage
        .from(data.bucket)
        .uploadToSignedUrl(target.path, target.token, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedImages.push(target);
    }

    return uploadedImages;
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
      const selectedFiles = formData
        .getAll("images")
        .filter((value): value is File => value instanceof File && value.size > 0);

      if (selectedFiles.length > 0) {
        const uploadedImages = await uploadImagesDirectly(selectedFiles);
        formData.delete("images");
        formData.set("uploaded_images", JSON.stringify(uploadedImages));
      }

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
      setError(
        submitError instanceof TypeError && submitError.message === "Failed to fetch"
          ? "Kết nối upload bị gián đoạn. Hãy thử lại với ít ảnh hơn hoặc kiểm tra mạng."
          : submitError instanceof Error
            ? submitError.message
            : "Không thể lưu tài khoản."
      );
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
        />
        <span className={styles.helper}>
          Nếu upload ảnh mới ở chế độ sửa, gallery cũ sẽ được thay bằng bộ ảnh mới.
          Mỗi ảnh nên dưới 10MB để upload ổn định trên điện thoại.
        </span>
      </label>

      {initialValues?.images.length ? (
        <div className={styles.previewGrid}>
          {initialValues.images.map((image) => (
            <div key={image.id} className={styles.previewCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.imageUrl} alt="" className={styles.previewImage} />
              <span>Ảnh #{image.sortOrder + 1}</span>
            </div>
          ))}
        </div>
      ) : null}

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
