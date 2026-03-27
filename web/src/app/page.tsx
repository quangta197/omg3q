import Link from "next/link";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts } from "@/lib/accounts";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Mua bán nick OMG3Q uy tín, giá tốt theo server và VIP",
  description:
    "Landing page tổng cho shop nick OMG3Q, tập trung nhu cầu giao dịch thật theo server, VIP, bảng giá và hướng dẫn mua acc an toàn.",
  path: "/",
  keywords: [
    "mua nick omg3q",
    "shop nick omg3q uy tín",
    "bảng giá nick omg3q",
    "nick omg3q server s1",
  ],
});

const stats = [
  {
    value: "An toàn",
    label: "Mọi giao dịch đều có hỗ trợ xác minh và hướng dẫn đổi thông tin.",
  },
  {
    value: "Nhanh chóng",
    label: "Tư vấn, giữ acc và chốt đơn theo nhịp realtime qua Zalo hoặc điện thoại.",
  },
  {
    value: "Uy tín 5 sao",
    label: "Trải nghiệm rõ giá, rõ mô tả, dễ so sánh và dễ chốt tài khoản phù hợp.",
  },
];

const quickFilters = [
  { label: "Dưới 500k", href: "/accounts?price_max=500000" },
  { label: "500k - 2tr", href: "/accounts?price_min=500000&price_max=2000000" },
  { label: "Trên 2tr", href: "/accounts?price_min=2000000" },
  { label: "Top server", href: "/accounts?sort=power_desc" },
  { label: "Acc newbie", href: "/accounts?price_max=1000000" },
];

export default async function Home() {
  const featuredAccounts = await getFeaturedAccounts(6);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([{ name: "Trang chủ", path: "/" }]),
          buildItemListSchema("/", featuredAccounts),
        ]}
      />

      <div className={styles.page}>
        <main>
          <section className={styles.hero}>
            <div className={`container ${styles.heroInner}`}>
              <span className={styles.eyebrow}>
                Hệ thống mua bán nick OMG 3Q ưu tiên chuyển đổi thật
              </span>
              <h1 className={styles.heroTitle}>
                Tìm Kiếm <span className={styles.heroTitleAccent}>Acc VIP</span>
                <br />
                Trải Nghiệm Đỉnh Cao
              </h1>
              <p className={styles.heroText}>
                Hàng ngàn tài khoản lực chiến mạnh, server hot, mô tả rõ ràng và
                đường dẫn SEO sạch. Từ landing page đến detail page đều tối ưu cho
                cả desktop lẫn mobile.
              </p>

              <form className={styles.searchPanel} action="/accounts" method="get">
                <input
                  className={styles.searchField}
                  type="text"
                  name="search"
                  placeholder="Nhập từ khóa, server hoặc nhu cầu cụ thể"
                />
                <select className={styles.searchSelect} name="server" defaultValue="">
                  <option value="">Tất cả Server</option>
                  <option value="s1">Server S1</option>
                  <option value="s2">Server S2</option>
                  <option value="s3">Server S3</option>
                </select>
                <button className={styles.searchButton} type="submit">
                  Tìm Kiếm
                </button>
              </form>

              <div className={styles.quickFilters}>
                {quickFilters.map((filter) => (
                  <Link key={filter.label} href={filter.href}>
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className={`${styles.section} ${styles.listingSection}`}>
            <div className={styles.listingHead}>
              <div>
                <span className={styles.sectionEyebrow}>Danh sách mới nhất</span>
                <h2 className={styles.sectionTitle}>
                  Tài Khoản Đang <span>Rao Bán</span>
                </h2>
              </div>
              <div className={styles.sortBox}>
                <span>Sắp xếp:</span>
                <select defaultValue="newest" aria-label="Sắp xếp tài khoản nổi bật">
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            <AccountGrid
              items={featuredAccounts}
              emptyMessage="Chưa kết nối Supabase hoặc chưa có nick nổi bật. Hãy import schema.sql, seed.sql và điền .env.local."
            />

            <div className={styles.trustStrip}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.trustCard}>
                  <span className={styles.trustIcon}>✦</span>
                  <div>
                    <div className={styles.trustTitle}>{stat.value}</div>
                    <p className={styles.trustText}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
