import styles from "./FloatingContact.module.css";

export function FloatingContact() {
  return (
    <div className={styles.wrap} aria-label="Liên hệ nhanh">
      <a
        className={styles.button}
        href={process.env.NEXT_PUBLIC_FB_PAGE || "#"}
        aria-label="Messenger"
      >
        M
      </a>
      <a
        className={styles.button}
        href={process.env.NEXT_PUBLIC_ZALO_LINK || "#"}
        aria-label="Zalo"
      >
        Z
      </a>
      <a
        className={`${styles.button} ${styles.hotline}`}
        href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0123456789"}`}
        aria-label="Hotline"
      >
        G
      </a>
    </div>
  );
}
