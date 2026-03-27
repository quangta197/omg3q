import Link from "next/link";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import styles from "./layout.module.css";

export const metadata: Metadata = createMetadata({
  title: "Admin CMS OMG3Q Shop",
  description: "Khu vực quản trị để nhập dữ liệu nick OMG3Q và upload ảnh.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin CMS</span>
          <h1 className={styles.title}>Quản trị nội dung OMG3Q Shop</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin/accounts" className={styles.navLink}>
            Tài khoản
          </Link>
          <Link href="/" className={styles.navLinkMuted}>
            Xem site
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
