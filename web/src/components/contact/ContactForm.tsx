"use client";

import { useState } from "react";
import type { ContactMethod } from "@/lib/types";
import styles from "./ContactForm.module.css";

type ContactFormProps = {
  accountId?: string;
  accountTitle?: string;
  title?: string;
  description?: string;
};

type SubmitState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const initialState: SubmitState = {
  type: "idle",
  message: "",
};

export function ContactForm({
  accountId,
  accountTitle,
  title = "Gửi yêu cầu giữ acc",
  description = "Điền thông tin để shop chốt lại giá, giữ tài khoản và hướng dẫn bàn giao rõ ràng.",
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialState);
  const [method, setMethod] = useState<ContactMethod>("zalo");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const payload = {
      account_id: accountId,
      customer_name: String(form.get("customer_name") || ""),
      customer_phone: String(form.get("customer_phone") || ""),
      customer_zalo: String(form.get("customer_zalo") || ""),
      contact_method: method,
      message: String(form.get("message") || ""),
    };

    setIsSubmitting(true);
    setSubmitState(initialState);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Không thể gửi yêu cầu.");
      }

      event.currentTarget.reset();
      setMethod("zalo");
      setSubmitState({
        type: "success",
        message: data.message || "Đã gửi yêu cầu thành công.",
      });
    } catch (error) {
      setSubmitState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi yêu cầu. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.shell}>
      <div className={styles.head}>
        <span className={styles.eyebrow}>Liên hệ nhanh</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        {accountTitle ? (
          <p className={styles.accountNote}>
            Bạn đang quan tâm: <strong>{accountTitle}</strong>
          </p>
        ) : null}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Họ và tên</span>
            <input
              className={styles.input}
              name="customer_name"
              placeholder="Nguyễn Văn A"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Số điện thoại</span>
            <input
              className={styles.input}
              name="customer_phone"
              inputMode="tel"
              placeholder="0987654321"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Zalo</span>
            <input
              className={styles.input}
              name="customer_zalo"
              inputMode="tel"
              placeholder="Nếu khác số điện thoại"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Cách liên hệ</span>
            <select
              className={styles.select}
              name="contact_method"
              value={method}
              onChange={(event) => setMethod(event.target.value as ContactMethod)}
            >
              <option value="zalo">Zalo</option>
              <option value="phone">Điện thoại</option>
              <option value="facebook">Messenger</option>
              <option value="form">Nhắn trước, chốt sau</option>
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Tin nhắn</span>
          <textarea
            className={styles.textarea}
            name="message"
            rows={5}
            placeholder="Ví dụ: Mình muốn giữ acc này đến tối, check giúp giá cuối và quy trình đổi thông tin."
          />
        </label>

        {submitState.type !== "idle" ? (
          <p
            className={
              submitState.type === "success" ? styles.success : styles.error
            }
          >
            {submitState.message}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
          <p className={styles.helper}>
            Điền đủ thông tin để shop gọi lại nhanh hơn và giữ đúng tài khoản bạn đang quan tâm.
          </p>
        </div>
      </form>
    </section>
  );
}
