import Image from "next/image";
import Link from "next/link";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts, getServers } from "@/lib/accounts";
import { createMetadata, formatPrice } from "@/lib/seo";
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

const HARD_CODED_HOME_BANNER_URL = "/omg_banner.png";
const HARD_CODED_HOME_BANNER_HREF = "/accounts";
const HARD_CODED_HOME_BANNER_ALT = "Banner giao dịch chính chủ nick VIP OMG3Q Shop";

export default async function Home() {
  const [featuredAccounts, servers] = await Promise.all([
    getFeaturedAccounts(6),
    getServers(),
  ]);
  const spotlightAccount = featuredAccounts[0] ?? null;
  const bannerAccounts = featuredAccounts.slice(1, 5);

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
              <div
                className={[
                  styles.bannerShell,
                  HARD_CODED_HOME_BANNER_URL ? styles.bannerShellFullWidth : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {HARD_CODED_HOME_BANNER_URL ? (
                  <article className={styles.bannerFrame}>
                    <Link href={HARD_CODED_HOME_BANNER_HREF} className={styles.bannerImageLink}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={HARD_CODED_HOME_BANNER_URL}
                        alt={HARD_CODED_HOME_BANNER_ALT}
                        className={styles.bannerImage}
                      />
                    </Link>
                  </article>
                ) : (
                  <article className={styles.bannerFrame}>
                    <div className={styles.bannerFallback}>
                      <div className={styles.bannerContent}>
                        <div className={styles.bannerCopy}>
                          <span className={styles.bannerKicker}>Giao dịch chính chủ</span>
                          <h2 className={styles.bannerFallbackTitle}>
                            Nick VIP siêu cấp cho server hot, chốt nhanh trong ngày
                          </h2>
                          <p className={styles.bannerFallbackText}>
                            Banner động lấy trực tiếp từ nick nổi bật để trang chủ luôn có
                            điểm nhấn bán hàng, kể cả khi bạn chưa nạp ảnh quảng cáo riêng.
                          </p>
                          <div className={styles.bannerActions}>
                            <Link href="/accounts" className={styles.bannerPrimary}>
                              Xem toàn bộ nick
                            </Link>
                            <Link href="/lien-he" className={styles.bannerSecondary}>
                              Liên hệ tư vấn
                            </Link>
                          </div>
                        </div>

                        <div className={styles.bannerVisual}>
                          {spotlightAccount ? (
                            <Link
                              href={`/accounts/${spotlightAccount.slug}`}
                              className={styles.spotlightCard}
                            >
                              <div className={styles.spotlightMedia}>
                                {spotlightAccount.thumbnailUrl ? (
                                  <Image
                                    src={spotlightAccount.thumbnailUrl}
                                    alt={spotlightAccount.title}
                                    fill
                                    className={styles.spotlightImage}
                                    sizes="(max-width: 820px) 100vw, 340px"
                                    unoptimized
                                  />
                                ) : null}
                                <span className={styles.spotlightBadge}>VIP {spotlightAccount.vipLevel}</span>
                              </div>
                              <div className={styles.spotlightBody}>
                                <span className={styles.spotlightLabel}>Nick nổi bật</span>
                                <h3>{spotlightAccount.title}</h3>
                                <div className={styles.spotlightMeta}>
                                  <span>Server {spotlightAccount.server.toUpperCase()}</span>
                                  <span>{formatPrice(spotlightAccount.price)}</span>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className={styles.spotlightPlaceholder}>
                              <span className={styles.spotlightLabel}>OMG3Q Shop</span>
                              <h3>Kho nick game đang chờ bạn thêm dữ liệu nổi bật</h3>
                              <p>Chỉ cần đánh dấu featured là banner sẽ tự làm mới.</p>
                            </div>
                          )}

                          {bannerAccounts.length > 0 ? (
                            <div className={styles.bannerMiniGrid}>
                              {bannerAccounts.map((account) => (
                                <Link
                                  key={account.id}
                                  href={`/accounts/${account.slug}`}
                                  className={styles.miniCard}
                                >
                                  <div className={styles.miniCardMedia}>
                                    {account.thumbnailUrl ? (
                                      <Image
                                        src={account.thumbnailUrl}
                                        alt={account.title}
                                        fill
                                        className={styles.miniCardImage}
                                        sizes="(max-width: 820px) 50vw, 180px"
                                        unoptimized
                                      />
                                    ) : null}
                                  </div>
                                  <div className={styles.miniCardBody}>
                                    <span className={styles.miniCardServer}>
                                      {account.server.toUpperCase()}
                                    </span>
                                    <strong>{account.title}</strong>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.bannerRibbon}>
                        Shop mua bán nick OMG3Q uy tín, rõ ảnh và rõ giá
                      </div>
                    </div>
                  </article>
                )}
              </div>

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
