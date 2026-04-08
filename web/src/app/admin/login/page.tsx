import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import {
  ADMIN_HOME_PATH,
  getAdminAuthSetupIssues,
  sanitizeAdminNextPath,
} from "@/lib/admin-session";
import { createMetadata } from "@/lib/seo";
import styles from "./page.module.css";

export const metadata: Metadata = createMetadata({
  title: "Đăng nhập quản trị OMG3Q Shop",
  description: "Đăng nhập khu vực quản trị nội dung của OMG3Q Shop.",
  path: "/admin/login",
  noIndex: true,
});

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    reason?: string;
  }>;
};

function getReasonMessage(reason?: string) {
  if (reason === "setup") {
    return "Phần đăng nhập quản trị chưa được cấu hình đầy đủ trên môi trường hiện tại.";
  }

  if (reason === "auth") {
    return "Bạn cần đăng nhập lại để truy cập khu quản trị.";
  }

  return "Chỉ email quản trị nằm trong danh sách cho phép mới đăng nhập được.";
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const session = await getAdminSessionFromCookies();

  if (session) {
    redirect(ADMIN_HOME_PATH);
  }

  const params = await searchParams;
  const nextPath = sanitizeAdminNextPath(params.next);
  const setupIssues = getAdminAuthSetupIssues();

  return (
    <section className={styles.page}>
      <div className={styles.panel}>
        <span className={styles.eyebrow}>Đăng nhập admin</span>
        <h1 className={styles.title}>Xác thực trước khi chỉnh dữ liệu</h1>
        <p className={styles.description}>{getReasonMessage(params.reason)}</p>
      </div>

      {setupIssues.length > 0 ? (
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Thiếu cấu hình bảo mật</h2>
          <p className={styles.description}>
            Điền đủ các biến sau trong `web/.env` hoặc `web/.env.local` rồi khởi động lại
            server.
          </p>
          <ul className={styles.issueList}>
            {setupIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Đăng nhập tài khoản quản trị</h2>
          <p className={styles.description}>
            Sau khi đăng nhập thành công, hệ thống sẽ tạo phiên bảo mật để bảo vệ toàn bộ khu
            quản trị và API admin.
          </p>
          <AdminLoginForm nextPath={nextPath || ADMIN_HOME_PATH} />
        </div>
      )}
    </section>
  );
}
