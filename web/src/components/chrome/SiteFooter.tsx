import Link from "next/link";
import {
  FormIcon,
  MessengerIcon,
  PhoneIcon,
  ZaloIcon,
} from "./ContactIcons";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brandBlock}>
          <div className={styles.brand}>
            <span className={styles.logoMark}>S</span>
            <span className={styles.logoText}>
              OMG<span>3Q</span> Shop
            </span>
          </div>
          <p className={styles.description}>
            Hệ thống mua bán tài khoản OMG 3Q theo hướng marketplace rõ thông tin,
            rõ giá và tối ưu chuyển đổi trên di động lẫn desktop.
          </p>
          <div className={styles.socials}>
            <a href={process.env.NEXT_PUBLIC_FB_PAGE || "#"} aria-label="Messenger">
              <MessengerIcon className={styles.socialIcon} />
              <span>Messenger</span>
            </a>
            <a href={process.env.NEXT_PUBLIC_ZALO_LINK || "#"} aria-label="Zalo">
              <ZaloIcon className={styles.socialIcon} />
              <span>Zalo</span>
            </a>
          </div>
        </div>

        <div className={styles.column}>
          <h3>Về Chúng Tôi</h3>
          <Link href="/">Giới thiệu</Link>
          <Link href="/accounts">Mua nick</Link>
          <Link href="/bang-gia-nick-omg3q">Ký gửi</Link>
          <Link href="/blog">Tin tức</Link>
        </div>

        <div className={styles.column}>
          <h3>Hỗ Trợ Khách Hàng</h3>
          <Link href="/blog/cach-mua-nick-omg3q-an-toan">Hướng dẫn mua nick</Link>
          <Link href="/bang-gia-nick-omg3q">Bảng giá tham khảo</Link>
          <Link href="/accounts/server/s1">Nick theo server</Link>
          <Link href="/accounts/nation/nguy">Nick theo quốc gia</Link>
        </div>

        <div className={styles.column}>
          <h3>Liên Hệ</h3>
          <p className={styles.newsText}>
            Gửi nhu cầu mua acc, giữ nick hoặc cần shop lọc tài khoản phù hợp theo
            ngân sách.
          </p>
          <div className={styles.socials}>
            <a href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0366710837"}`}>
              <PhoneIcon className={styles.socialIcon} />
              <span>Hotline</span>
            </a>
            <Link href="/lien-he">
              <FormIcon className={styles.socialIcon} />
              <span>Gửi form</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© 2026 OMG3Q Shop</span>
      </div>
    </footer>
  );
}
