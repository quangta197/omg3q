"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import styles from "./SiteHeader.module.css";

const navItems = [
  { href: "/", label: "Trang Chủ" },
  { href: "/accounts", label: "Mua Acc" },
  { href: "/accounts/vip", label: "Acc VIP" },
  { href: "/bang-gia-nick-omg3q", label: "Bảng Giá" },
  { href: "/blog", label: "Kinh Nghiệm" },
  { href: "/huong-dan-mua-acc-omg3q", label: "Hướng Dẫn" },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/accounts") {
    return (
      pathname === "/accounts" ||
      (pathname.startsWith("/accounts/") && !pathname.startsWith("/accounts/vip"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

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
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/lien-he" className={styles.primaryAction}>
            Liên Hệ
          </Link>
        </div>
      </div>
    </header>
  );
}
