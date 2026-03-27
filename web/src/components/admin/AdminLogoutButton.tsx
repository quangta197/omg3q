"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import styles from "./AdminLogoutButton.module.css";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    await fetch("/api/admin/session", {
      method: "DELETE",
    });

    startTransition(() => {
      router.replace("/admin/login");
      router.refresh();
    });
  }

  return (
    <button
      className={styles.button}
      type="button"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "Đang thoát..." : "Đăng xuất"}
    </button>
  );
}
