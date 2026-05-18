"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} onClick={() => setIsMenuOpen(false)}>
          <span className={styles.logoMark}>S</span>
          <span className={styles.logoText}>
            OMG<span>3Q</span> Shop
          </span>
        </Link>

        <nav
          className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
          aria-label="Điều hướng chính"
        >
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/lien-he"
            className={`${styles.primaryAction} ${styles.primaryActionMobile}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Liên Hệ
          </Link>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <Link href="/lien-he" className={styles.primaryAction}>
            Liên Hệ
          </Link>
          <button
            type="button"
            className={`${styles.menuToggle} ${isMenuOpen ? styles.menuToggleOpen : ""}`}
            aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMenuOpen}
            aria-controls="site-primary-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        {isMenuOpen ? (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Đóng menu"
            onClick={() => setIsMenuOpen(false)}
          />
        ) : null}
      </div>
    </header>
  );
}
