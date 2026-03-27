import { AccountForm } from "@/components/admin/AccountForm";
import { getAdminAccountFormOptions } from "@/lib/admin-accounts";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";
import styles from "../editor-page.module.css";

export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <section className={styles.setupCard}>
      <h2>Thiếu cấu hình admin</h2>
      <p>CMS cần service role key và bucket storage để tạo nick có ảnh.</p>
      <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code>
      <code>SUPABASE_STORAGE_BUCKET=account-images</code>
    </section>
  );
}

export default async function NewAdminAccountPage() {
  if (!hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { servers, nations } = await getAdminAccountFormOptions();

  return (
    <section className={styles.page}>
      <div className={styles.panel}>
        <h2 className={styles.heading}>Tạo tài khoản mới</h2>
        <p className={styles.subheading}>
          Nhập đầy đủ thông tin cơ bản, highlights và chọn ảnh để tạo thumbnail.
        </p>
      </div>
      <div className={styles.panel}>
        <AccountForm mode="create" servers={servers} nations={nations} />
      </div>
    </section>
  );
}
