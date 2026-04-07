import Link from "next/link";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts, getServers } from "@/lib/accounts";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Mua bán nick OMG3Q uy tín, giá tốt theo server và VIP",
  description:
    "Trang chủ OMG3Q Shop với danh sách nick nổi bật, bộ lọc nhanh theo server và các hướng dẫn mua bán an toàn.",
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
  { label: "Nick tân thủ", href: "/accounts?price_max=1000000" },
];

export default async function Home() {
  const [featuredAccounts, servers] = await Promise.all([
    getFeaturedAccounts(6),
    getServers(),
  ]);

  const serverOptions: SearchableSelectOption[] = servers.map((server) => ({
    value: server.code,
    label: server.name,
    keywords: [server.code, server.name],
  }));

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
                Hàng ngàn tài khoản server hot, mô tả rõ ràng và dễ so sánh. Từ
                trang chủ đến trang chi tiết đều được tối ưu cho cả desktop lẫn
                mobile.
              </p>

              <form className={styles.searchPanel} action="/accounts" method="get">
                <input
                  className={styles.searchField}
                  type="text"
                  name="search"
                  placeholder="Nhập từ khóa, server hoặc nhu cầu cụ thể"
                />
                <SearchableSelect
                  id="home-server"
                  name="server"
                  options={serverOptions}
                  emptyLabel="Tất cả server"
                  placeholder="Tìm server như S930"
                  ariaLabel="Chọn server"
                  inputClassName={styles.searchSelect}
                />
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
              emptyMessage="Hiện chưa có tài khoản nổi bật. Bạn có thể quay lại sau hoặc liên hệ shop để được tư vấn nhanh."
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
