import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import styles from "./SiteHeader.module.css";

const navItems = [
  { href: "/", label: "Trang Chủ" },
  { href: "/accounts", label: "Mua Nick" },
  { href: "/bang-gia-nick-omg3q", label: "Bảng Giá" },
  { href: "/blog", label: "Tin Tức" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoMark}>S</span>
          <span className={styles.logoText}>
            OMG<span>3Q</span> Shop
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/bang-gia-nick-omg3q" className={styles.secondaryAction}>
            Ký Gửi
          </Link>
          <Link href="/lien-he" className={styles.primaryAction}>
            Liên Hệ
          </Link>
        </div>
      </div>
    </header>
  );
}
