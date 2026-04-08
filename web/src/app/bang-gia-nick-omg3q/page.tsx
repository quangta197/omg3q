import Link from "next/link";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts, getServerCodes } from "@/lib/accounts";
import { blogPosts } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Bảng Giá Acc OMG3Q | Theo VIP, Server và Đội Hình",
  description:
    "Bảng giá acc OMG3Q tham khảo theo VIP, server, quốc gia và độ đẹp đội hình. Dùng để khoanh ngân sách trước khi xem acc cụ thể.",
  path: "/bang-gia-nick-omg3q",
  keywords: [
    "bảng giá acc omg3q",
    "giá acc omg3q",
    "bảng giá acc omg3q",
    "giá acc omg3q vip 12",
  ],
});

const priceBands = [
  {
    title: "Nhóm dễ vào game",
    value: "Dưới 2 triệu",
    description:
      "Phù hợp người mới cần nền ổn, có mô tả rõ và muốn vào game nhanh mà không phải build lại từ đầu.",
    href: "/accounts?price_max=2000000",
  },
  {
    title: "Nhóm trung cấp dễ chốt",
    value: "2 đến 5 triệu",
    description:
      "Thường là phân khúc có nhiều acc đẹp, cân bằng giữa VIP, tài nguyên và độ hoàn thiện đội hình.",
    href: "/accounts?price_min=2000000&price_max=5000000",
  },
  {
    title: "Nhóm acc VIP mạnh",
    value: "Trên 5 triệu",
    description:
      "Phù hợp người cần acc nổi bật hơn, đội hình đẹp hơn hoặc nền tài nguyên sâu hơn.",
    href: "/accounts?price_min=5000000",
  },
];

export default async function PricingPage() {
  const [featuredAccounts, activeServerCodes] = await Promise.all([
    getFeaturedAccounts(4),
    getServerCodes(),
  ]);
  const guidePosts = blogPosts.slice(0, 3);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Bảng giá acc OMG3Q", path: "/bang-gia-nick-omg3q" },
        ])}
      />
      <MarketingShell
        eyebrow="Bảng giá tham khảo"
        title="Bảng giá acc OMG3Q theo VIP, server và độ đẹp đội hình"
        description="Trang này giúp bạn khoanh ngân sách trước khi quay về danh sách acc để xem ảnh thật, mô tả rõ và chốt acc phù hợp hơn."
        metrics={[
          { label: "Phù hợp", value: "Người đang so sánh ngân sách" },
          { label: "Dùng để", value: "Ước lượng nhanh trước khi chốt" },
          { label: "Đi tiếp", value: "Danh sách acc + chi tiết acc" },
        ]}
        sectionTitle="Cách dùng bảng giá cho đúng"
        sectionText="Đừng chốt acc chỉ dựa vào mức giá. Hãy dùng bảng giá như bộ lọc đầu tiên, sau đó quay lại danh sách acc OMG3Q và mở từng trang chi tiết để xem ảnh thật, highlights và quy trình bàn giao."
        bullets={[
          "So sánh acc cùng một tầm tiền trước khi ra quyết định.",
          "Đối chiếu thêm server, quốc gia và mức độ hoàn thiện đội hình.",
          "Ưu tiên những acc có gallery ảnh thật và mô tả rõ ràng.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem danh sách acc OMG3Q"
      />

      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Khung giá chính</span>
              <h2 className={styles.title}>Khoanh đúng tầm tiền trước khi đi sâu vào từng acc</h2>
            </div>
            <Link href="/accounts" className={styles.primaryLink}>
              Mở bộ lọc đầy đủ
            </Link>
          </div>

          <div className={styles.bandGrid}>
            {priceBands.map((band) => (
              <article key={band.title} className={styles.bandCard}>
                <span className={styles.bandTitle}>{band.title}</span>
                <strong className={styles.bandValue}>{band.value}</strong>
                <p className={styles.bandDescription}>{band.description}</p>
                <Link href={band.href} className={styles.inlineLink}>
                  Xem acc trong tầm này
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Lối đi nhanh</span>
              <h2 className={styles.title}>Mở nhanh những nhóm acc đang có hàng</h2>
            </div>
          </div>

          <div className={styles.linkGrid}>
            <Link href="/accounts" className={styles.linkCard}>
              <strong>Danh sách acc OMG3Q</strong>
              <p>Mở toàn bộ danh sách để lọc theo server, giá và quốc gia trong một bước.</p>
            </Link>

            <Link
              href="/blog/cach-mua-nick-omg3q-an-toan"
              className={styles.linkCard}
            >
              <strong>Cách mua acc an toàn</strong>
              <p>Đọc checklist trước khi chốt để tránh mua nhầm hoặc thiếu bước bàn giao.</p>
            </Link>

            {activeServerCodes.slice(0, 3).map((serverCode) => (
              <Link
                key={serverCode}
                href={`/accounts/server/${serverCode}`}
                className={styles.linkCard}
              >
                <strong>Acc server {serverCode.toUpperCase()}</strong>
                <p>Xem nhanh những acc đang có sẵn ở nhóm server này.</p>
              </Link>
            ))}
          </div>
        </section>

        {featuredAccounts.length ? (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.eyebrow}>Acc nổi bật</span>
                <h2 className={styles.title}>Một số account đáng tham khảo trong từng tầm giá</h2>
              </div>
            </div>

            <AccountGrid items={featuredAccounts} />
          </section>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Đọc tiếp</span>
              <h2 className={styles.title}>Bài blog hỗ trợ chọn acc sáng hơn</h2>
            </div>
            <Link href="/blog" className={styles.secondaryLink}>
              Xem toàn bộ blog
            </Link>
          </div>

          <div className={styles.linkGrid}>
            {guidePosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.linkCard}>
                <strong>{post.title}</strong>
                <p>{post.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
