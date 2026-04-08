import {
  MessengerIcon,
  PhoneIcon,
  ZaloIcon,
} from "./ContactIcons";
import styles from "./FloatingContact.module.css";

export function FloatingContact() {
  return (
    <div className={styles.wrap} aria-label="Liên hệ nhanh">
      <a
        className={`${styles.button} ${styles.messenger}`}
        href={process.env.NEXT_PUBLIC_FB_PAGE || "#"}
        aria-label="Messenger"
        title="Messenger"
      >
        <span className={styles.label}>Messenger</span>
        <MessengerIcon className={styles.icon} />
        <span className={styles.srOnly}>Messenger</span>
      </a>
      <a
        className={`${styles.button} ${styles.zalo}`}
        href={process.env.NEXT_PUBLIC_ZALO_LINK || "#"}
        aria-label="Zalo"
        title="Zalo"
      >
        <span className={styles.label}>Zalo</span>
        <ZaloIcon className={styles.icon} />
        <span className={styles.srOnly}>Zalo</span>
      </a>
      <a
        className={`${styles.button} ${styles.hotline}`}
        href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0366710837"}`}
        aria-label="Hotline"
        title="Hotline"
      >
        <span className={styles.label}>Hotline</span>
        <PhoneIcon className={styles.icon} />
        <span className={styles.srOnly}>Hotline</span>
      </a>
    </div>
  );
}
