import Link from "next/link";
import type { Metadata } from "next";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { createMetadata } from "@/lib/seo";
import styles from "./layout.module.css";

export const metadata: Metadata = createMetadata({
  title: "Admin CMS OMG3Q Shop",
  description: "Khu vực quản trị để nhập dữ liệu acc OMG3Q và tải ảnh.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSessionFromCookies();

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin CMS</span>
          <h1 className={styles.title}>Quản trị nội dung OMG3Q Shop</h1>
        </div>
        <nav className={styles.nav}>
          {session ? (
            <>
              <span className={styles.sessionBadge}>{session.email}</span>
              <Link href="/admin/accounts" className={styles.navLink}>
                Tài khoản
              </Link>
              <AdminLogoutButton />
            </>
          ) : (
            <Link href="/admin/login" className={styles.navLink}>
              Đăng nhập
            </Link>
          )}
          <Link href="/" className={styles.navLinkMuted}>
            Xem website
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
