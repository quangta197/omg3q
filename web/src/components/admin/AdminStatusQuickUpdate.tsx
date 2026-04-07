"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminAccountStatus } from "@/lib/admin-accounts";
import styles from "./AdminStatusQuickUpdate.module.css";

type AdminStatusQuickUpdateProps = {
  accountId: string;
  initialStatus: AdminAccountStatus;
};

const STATUS_OPTIONS: Array<{
  value: AdminAccountStatus;
  label: string;
}> = [
  { value: "available", label: "Đang bán" },
  { value: "reserved", label: "Đang giữ" },
  { value: "sold", label: "Đã bán" },
  { value: "hidden", label: "Ẩn" },
];

function getStatusClassName(status: AdminAccountStatus) {
  if (status === "available") {
    return styles.statusAvailable;
  }

  if (status === "reserved") {
    return styles.statusReserved;
  }

  if (status === "sold") {
    return styles.statusSold;
  }

  return styles.statusHidden;
}

function getStatusLabel(status: AdminAccountStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || "Ẩn";
}

export function AdminStatusQuickUpdate({
  accountId,
  initialStatus,
}: AdminStatusQuickUpdateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminAccountStatus>(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"neutral" | "error">("neutral");

  async function handleStatusChange(nextStatus: AdminAccountStatus) {
    if (nextStatus === status) {
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);
    setIsSaving(true);
    setFeedback("Đang lưu...");
    setFeedbackTone("neutral");

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Không thể cập nhật trạng thái.");
      }

      setFeedback("Đã cập nhật");
      setFeedbackTone("neutral");
      router.refresh();
    } catch (error) {
      setStatus(previousStatus);
      setFeedback(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
      setFeedbackTone("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <span className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
        {getStatusLabel(status)}
      </span>

      <select
        className={styles.select}
        value={status}
        onChange={(event) => handleStatusChange(event.currentTarget.value as AdminAccountStatus)}
        disabled={isSaving}
        aria-label="Cập nhật trạng thái tài khoản"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span
        className={`${styles.feedback} ${
          feedbackTone === "error" ? styles.feedbackError : ""
        }`}
      >
        {feedback || "Đổi ngay trên dòng này"}
      </span>
    </div>
  );
}
