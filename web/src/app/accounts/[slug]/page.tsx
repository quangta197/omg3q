import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountGallery } from "@/components/accounts/AccountGallery";
import { ContactForm } from "@/components/contact/ContactForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccountBySlug, getAccountSlugs } from "@/lib/accounts";
import { createMetadata, formatPrice } from "@/lib/seo";
import { buildBreadcrumbSchema, buildProductSchema } from "@/lib/schema";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import styles from "./page.module.css";

export const revalidate = 300;

type AccountDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAccountSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AccountDetailPageProps) {
  const { slug } = await params;
  const account = await getAccountBySlug(slug);

  if (!account) {
    return createMetadata({
      title: "Nick OMG3Q không tồn tại",
      description: "Trang không tồn tại hoặc đã được ẩn khỏi danh sách.",
      path: `/accounts/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: account.title,
    description: account.description,
    path: `/accounts/${slug}`,
    keywords: [
      "chi tiết nick omg3q",
      account.server,
      `vip ${account.vipLevel}`,
      account.nation,
    ],
  });
}

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { slug } = await params;
  const account = await getAccountBySlug(slug);

  if (!account) {
    if (!isSupabaseConfigured()) {
      return (
        <MarketingShell
          eyebrow="Supabase setup required"
          title="Trang chi tiết sẽ có dữ liệu thật sau khi kết nối Supabase."
          description="App đã sẵn sàng cho SSR và ISR, nhưng project chưa có env hoặc chưa import schema và seed. Điền .env.local rồi chạy schema.sql, seed.sql để route này có dữ liệu."
          metrics={[
            { label: "Bước 1", value: "Điền .env.local" },
            { label: "Bước 2", value: "Run schema.sql" },
            { label: "Bước 3", value: "Run seed.sql" },
          ]}
          sectionTitle="Route này đang dùng data layer thật"
          sectionText="Không còn mock data runtime cho account detail. Sau khi kết nối Supabase, metadata, schema và rendering đều lấy trực tiếp từ database."
          bullets={[
            "Thêm URL và publishable key của Supabase.",
            "Import schema.sql và seed.sql vào SQL editor.",
            "Build lại app để kiểm tra route chi tiết.",
          ]}
          ctaHref="/accounts"
          ctaLabel="Mở trang danh sách"
        />
      );
    }

    notFound();
  }

  const jsonLdData = [
    buildBreadcrumbSchema([
      { name: "Trang chủ", path: "/" },
      { name: "Danh sách nick", path: "/accounts" },
      { name: account.title, path: `/accounts/${account.slug}` },
    ]),
    buildProductSchema(account),
  ];

  const nationLabel =
    account.nation === "nguy"
      ? "Ngụy"
      : account.nation === "thuc"
        ? "Thục"
        : account.nation === "ngo"
          ? "Ngô"
          : String(account.nation).toUpperCase();

  const statusLabel =
    account.status === "sold"
      ? "Đã bán"
      : account.status === "reserved"
        ? "Đang giữ"
        : "Đang rao bán";

  const galleryImages = account.images.length
    ? account.images
    : account.thumbnailUrl
      ? [
          {
            id: `${account.id}-thumb`,
            imageUrl: account.thumbnailUrl,
            caption: account.title,
            sortOrder: 0,
          },
        ]
      : [];

  return (
    <>
      <JsonLd data={jsonLdData} />
      <main className={`container ${styles.page}`}>
        <div className={styles.frame}>
          <AccountGallery title={account.title} images={galleryImages} />

          <section className={styles.content}>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Mã số: #{account.slug.slice(-5)}</span>
              <span className={styles.subtleBadge}>
                {account.server.toUpperCase()} - {nationLabel}
              </span>
            </div>

            <div className={styles.headerBlock}>
              <h2 className={styles.title}>{account.title}</h2>
              {account.originalPrice ? (
                <div className={styles.oldPrice}>
                  {formatPrice(account.originalPrice)}
                </div>
              ) : null}
              <div className={styles.price}>{formatPrice(account.price)}</div>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Lực chiến</span>
                <span className={styles.statValue}>
                  {account.powerScore.toLocaleString("vi-VN")}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Server</span>
                <span className={styles.statValue}>{account.server.toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.notice}>
              <div className={styles.noticeTitle}>Bảo hiểm giao dịch</div>
              <p className={styles.noticeText}>
                Tài khoản này được hỗ trợ xác minh bởi OMG3Q Shop. Hoàn tiền nếu có
                sai khác thông tin so với mô tả đã công khai.
              </p>
            </div>

            <section className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Thông số tài khoản</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Quốc gia</span>
                  <span className={styles.infoValue}>{nationLabel}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cấp VIP</span>
                  <span className={styles.infoValue}>VIP {account.vipLevel}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Level</span>
                  <span className={styles.infoValue}>Lv. {account.level}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tình trạng</span>
                  <span
                    className={`${styles.infoValue} ${
                      account.status === "sold" ? styles.statusSold : styles.statusAvailable
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Highlight</span>
                  <span className={styles.infoValue}>
                    {account.highlights.length
                      ? account.highlights.join(", ")
                      : "VIP mạnh, đội hình sẵn sàng chiến"}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.descriptionBlock}>
              <h3 className={styles.infoTitle}>Mô tả chi tiết</h3>
              <p className={styles.description}>
                {account.description ||
                  "Nick đã build ổn định, phù hợp người cần giá tốt và muốn vào game nhanh."}
              </p>
            </section>

            <div className={styles.ctaBar}>
              <Link className={styles.closePill} href="/accounts">
                Danh sách
              </Link>
              <a
                className={styles.callCta}
                href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0123456789"}`}
              >
                Gọi ngay: {process.env.NEXT_PUBLIC_PHONE || "0123456789"}
              </a>
            </div>

            <div className={styles.quickActions}>
              <a
                className={styles.secondaryCta}
                href={process.env.NEXT_PUBLIC_FB_PAGE || "#"}
              >
                Messenger
              </a>
              <a
                className={styles.secondaryCta}
                href={process.env.NEXT_PUBLIC_ZALO_LINK || "#"}
              >
                Zalo
              </a>
            </div>
          </section>
        </div>

        <section className={styles.formSection}>
          <ContactForm
            accountId={account.id}
            accountTitle={account.title}
            title="Giữ nick này ngay"
            description="Form này đẩy trực tiếp vào contact_requests để đội ngũ xử lý theo thứ tự, giảm sót lead so với chỉ bấm chat."
          />
        </section>
      </main>
    </>
  );
}
