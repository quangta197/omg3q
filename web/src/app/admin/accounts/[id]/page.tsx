import { notFound } from "next/navigation";
import { AccountForm } from "@/components/admin/AccountForm";
import { requireAdminPageSession } from "@/lib/admin-auth";
import {
  getAdminAccountById,
  getAdminAccountFormOptions,
} from "@/lib/admin-accounts";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";
import styles from "../editor-page.module.css";

export const dynamic = "force-dynamic";

type EditAdminAccountPageProps = {
  params: Promise<{ id: string }>;
};

function SetupNotice() {
  return (
    <section className={styles.setupCard}>
      <h2>Thiếu cấu hình admin</h2>
      <p>CMS cần service role key và bucket storage để sửa nick có ảnh.</p>
      <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code>
      <code>SUPABASE_STORAGE_BUCKET=account-images</code>
    </section>
  );
}

export default async function EditAdminAccountPage({
  params,
}: EditAdminAccountPageProps) {
  const { id } = await params;

  await requireAdminPageSession(`/admin/accounts/${id}`);

  if (!hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const [account, options] = await Promise.all([
    getAdminAccountById(id),
    getAdminAccountFormOptions(),
  ]);

  if (!account) {
    notFound();
  }

  return (
    <section className={styles.page}>
      <div className={styles.panel}>
        <h2 className={styles.heading}>Sửa tài khoản</h2>
        <p className={styles.subheading}>
          Cập nhật dữ liệu hiển thị trên site và thay gallery ảnh nếu cần.
        </p>
      </div>
      <div className={styles.panel}>
        <AccountForm
          mode="edit"
          accountId={account.id}
          initialValues={{
            slug: account.slug,
            title: account.title,
            description: account.description,
            serverId: account.serverId,
            nationId: account.nationId,
            powerScore: account.powerScore,
            level: account.level,
            vipLevel: account.vipLevel,
            price: account.price,
            originalPrice: account.originalPrice,
            status: account.status,
            highlights: account.highlights,
            isFeatured: account.isFeatured,
            images: account.images,
          }}
          servers={options.servers}
          nations={options.nations}
        />
      </div>
    </section>
  );
}
