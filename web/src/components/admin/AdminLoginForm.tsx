"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./AdminLoginForm.module.css";

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setError("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Không thể đăng nhập admin.");
      }

      startTransition(() => {
        router.replace(nextPath);
        router.refresh();
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Không thể đăng nhập admin."
      );
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Email admin</span>
        <input
          className={styles.input}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Mật khẩu</span>
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button className={styles.submitButton} type="submit" disabled={isPending}>
        {isPending ? "Đang xác thực..." : "Đăng nhập admin"}
      </button>
    </form>
  );
}
