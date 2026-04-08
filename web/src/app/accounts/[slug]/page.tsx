import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountGallery } from "@/components/accounts/AccountGallery";
import { ContactForm } from "@/components/contact/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccountBySlug, getAccountSlugs } from "@/lib/accounts";
import {
  createMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
  formatPrice,
} from "@/lib/seo";
import {
  buildBreadcrumbSchema,
  buildProductSchema,
  buildWebPageSchema,
} from "@/lib/schema";
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
      title: "Acc OMG3Q không tồn tại",
      description: "Trang không tồn tại hoặc đã được ẩn khỏi danh sách.",
      path: `/accounts/${slug}`,
      noIndex: true,
    });
  }

  const previewImage =
    account.thumbnailUrl ?? account.images[0]?.imageUrl ?? DEFAULT_SOCIAL_IMAGE_PATH;

  return createMetadata({
    title: account.title,
    description: account.description,
    path: `/accounts/${slug}`,
    keywords: [
      "chi tiết acc omg3q",
      account.server,
      `vip ${account.vipLevel}`,
      account.nation,
    ],
    image: previewImage,
    imageAlt: account.title,
  });
}

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { slug } = await params;
  const account = await getAccountBySlug(slug);

  if (!account) {
    notFound();
  }

  const previewImage =
    account.thumbnailUrl ?? account.images[0]?.imageUrl ?? DEFAULT_SOCIAL_IMAGE_PATH;

  const jsonLdData = [
    buildWebPageSchema({
      name: account.title,
      description: account.description,
      path: `/accounts/${account.slug}`,
      image: previewImage,
    }),
    buildBreadcrumbSchema([
      { name: "Trang chủ", path: "/" },
      { name: "Danh sách acc", path: "/accounts" },
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
  const hasInstallment =
    account.installmentPrice !== null && account.installmentPrice > 0;

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
              <div className={styles.price}>{formatPrice(account.price)}</div>
              {hasInstallment ? (
                <div className={styles.installmentCard}>
                  <span className={styles.installmentLabel}>Hỗ trợ góp từ</span>
                  <strong className={styles.installmentValue}>
                    {formatPrice(account.installmentPrice ?? 0)}
                  </strong>
                  <span className={styles.installmentHint}>
                    Inbox shop để trao đổi phương án thanh toán phù hợp.
                  </span>
                </div>
              ) : null}
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>VIP</span>
                <span className={styles.statValue}>VIP {account.vipLevel}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Server</span>
                <span className={styles.statValue}>{account.server.toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.notice}>
              <div className={styles.noticeTitle}>Bảo hiểm giao dịch</div>
              <p className={styles.noticeText}>
                Tài khoản này được shop hỗ trợ xác minh. Nếu có sai khác lớn so với
                mô tả công khai, bạn sẽ được hỗ trợ xử lý nhanh.
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
                {hasInstallment ? (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Giá góp tham khảo</span>
                    <span className={styles.infoValue}>
                      {formatPrice(account.installmentPrice ?? 0)}
                    </span>
                  </div>
                ) : null}
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Highlight</span>
                  <span className={styles.infoValue}>
                    {account.highlights.length
                      ? account.highlights.join(", ")
                      : "Đội hình ổn định, vào game là chơi được ngay"}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.descriptionBlock}>
              <h3 className={styles.infoTitle}>Mô tả chi tiết</h3>
              <p className={styles.description}>
                {account.description ||
                  "Acc đã build ổn định, phù hợp người cần giá tốt và muốn vào game nhanh."}
              </p>
            </section>

            <div className={styles.ctaBar}>
              <Link className={styles.closePill} href="/accounts">
                Danh sách
              </Link>
              <a
                className={styles.callCta}
                href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0366710837"}`}
              >
                Gọi ngay: {process.env.NEXT_PUBLIC_PHONE || "0366710837"}
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
            title={hasInstallment ? "Hỏi phương án góp cho acc này" : "Giữ acc này ngay"}
            description={
              hasInstallment
                ? `Để lại thông tin để shop tư vấn phương án góp từ ${formatPrice(
                    account.installmentPrice ?? 0
                  )} và chốt lịch thanh toán phù hợp.`
                : "Để lại thông tin để shop giữ acc, xác nhận giá và hướng dẫn bàn giao rõ ràng."
            }
          />
        </section>
      </main>
    </>
  );
}
