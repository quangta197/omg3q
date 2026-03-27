import Link from "next/link";
import { getAdminAccountsList } from "@/lib/admin-accounts";
import { formatPrice } from "@/lib/seo";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function SetupNotice() {
  return (
    <section className={styles.setupCard}>
      <h2>Thiếu cấu hình admin</h2>
      <p>
        CMS cần `SUPABASE_SERVICE_ROLE_KEY` để tạo nick và upload ảnh lên storage.
      </p>
      <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code>
      <code>SUPABASE_STORAGE_BUCKET=account-images</code>
    </section>
  );
}

export default async function AdminAccountsPage() {
  if (!hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const accounts = await getAdminAccountsList();

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.heading}>Danh sách tài khoản</h2>
          <p className={styles.subheading}>
            Quản lý dữ liệu nick, trạng thái bán và thumbnail hiển thị.
          </p>
        </div>
        <Link href="/admin/accounts/new" className={styles.primaryAction}>
          Tạo tài khoản mới
        </Link>
      </div>

      <div className={styles.list}>
        {accounts.map((account) => (
          <article key={account.id} className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>{account.title}</h3>
                <p className={styles.cardMeta}>
                  {account.serverName || "Chưa có server"} ·{" "}
                  {account.nationName || "Chưa có quốc gia"} · {account.slug}
                </p>
              </div>
              <span className={styles.status}>{account.status}</span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.price}>{formatPrice(account.price)}</div>
              <div className={styles.flags}>
                <span>{account.isFeatured ? "Featured" : "Standard"}</span>
                <span>
                  {account.updatedAt
                    ? new Date(account.updatedAt).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <Link href={`/admin/accounts/${account.id}`} className={styles.editLink}>
                Sửa dữ liệu
              </Link>
              <Link href={`/accounts/${account.slug}`} className={styles.previewLink}>
                Xem public page
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
