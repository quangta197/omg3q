import Image from "next/image";
import Link from "next/link";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { HomeSortControl } from "@/components/marketing/HomeSortControl";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccounts, getFeaturedAccounts, getServers } from "@/lib/accounts";
import { blogPosts } from "@/lib/blog-data";
import { createMetadata, formatPrice } from "@/lib/seo";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
  buildWebPageSchema,
} from "@/lib/schema";
import type { AccountSort, AccountSummary } from "@/lib/types";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Shop Acc OMG3Q Uy Tín #1 - Mua Bán Nick Giá Rẻ, Sẵn Sàn VIP & Lực Chiến",
  description: 
    "Hệ thống mua bán acc OMG3Q tự động, uy tín. Kho nick đa dạng: server mới, acc top lực chiến, đầy đủ các mốc VIP. Giao dịch an toàn, bảo mật thông tin 100%.",
  path: "/",
  keywords: [
    "mua acc omg3q",
    "shop acc omg3q uy tín",
    "bán nick omg3q giá rẻ",
    "acc omg3q s1 s2 s3",
    "mua acc omg3q vip 12",
    "thanh lý acc omg3q",
    "shop omg3q giá rẻ",
    "mua acc omg3q tự động"
  ],
});

const stats = [
  {
    value: "An toàn",
    label: "Mỗi giao dịch đều có ảnh thật, mô tả rõ và hướng dẫn bàn giao cụ thể.",
  },
  {
    value: "Nhanh chóng",
    label: "Shop hỗ trợ giữ acc, báo giá và chốt đơn nhanh qua Zalo hoặc điện thoại.",
  },
  {
    value: "Dễ chọn",
    label: "Lọc theo server, giá và VIP để tìm đúng tài khoản phù hợp với nhu cầu.",
  },
];

const quickFilters = [
  { label: "Dưới 500k", href: "/accounts?price_max=500000" },
  { label: "500k - 2tr", href: "/accounts?price_min=500000&price_max=2000000" },
  { label: "Trên 2tr", href: "/accounts?price_min=2000000" },
  { label: "Acc tân thủ", href: "/accounts?price_max=1000000" },
];

const homeFaqs = [
  {
    question: "Mua acc OMG3Q ở shop thì nên xem gì trước khi chốt?",
    answer:
      "Bạn nên xem ảnh thật, server, quốc gia, cấp VIP, highlights và mô tả bàn giao trước khi chốt giao dịch.",
  },
  {
    question: "Tôi có thể lọc acc OMG3Q theo ngân sách không?",
    answer:
      "Có. Bạn có thể lọc theo giá, server và từ khóa ngay trên trang danh sách acc OMG3Q để rút ngắn thời gian tìm acc phù hợp.",
  },
  {
    question: "Người mới chơi OMG3Q nên mua acc như thế nào?",
    answer:
      "Người mới nên ưu tiên acc có nền đội hình rõ ràng, mô tả dễ hiểu và mức giá vừa phải thay vì chạy theo chỉ số quá cao.",
  },
  {
    question: "Sau khi mua acc OMG3Q shop có hỗ trợ gì không?",
    answer:
      "Shop hỗ trợ hướng dẫn bàn giao, kiểm tra lại mô tả đã chốt và tư vấn các bước cần làm ngay sau khi nhận acc.",
  },
];

const HOME_BANNER_SOURCES = {
  desktop: "/banner_pc.png",
  tablet: "/banner_ipad.png",
  mobile: "/banner_mobile.jpg",
};
const HARD_CODED_HOME_BANNER_HREF = "/accounts";
const HARD_CODED_HOME_BANNER_ALT = "Banner giao dịch chính chủ acc VIP OMG3Q Shop";

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

type HomePageProps = {
  searchParams: HomeSearchParams;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseHomeSort(value: string | undefined): AccountSort {
  if (value === "price_asc" || value === "price_desc") {
    return value;
  }

  return "newest";
}

function sortHomeAccounts(items: AccountSummary[], sort: AccountSort) {
  if (sort === "price_asc") {
    return items.slice().sort((left, right) => left.price - right.price);
  }

  if (sort === "price_desc") {
    return items.slice().sort((left, right) => right.price - left.price);
  }

  return items;
}

export default async function Home({ searchParams }: HomePageProps) {
  const sort = parseHomeSort(firstValue((await searchParams).sort));
  const [featuredAccounts, allAccounts, servers] = await Promise.all([
    getFeaturedAccounts(6),
    getAccounts(),
    getServers(),
  ]);
  const sortedFeaturedAccounts = sortHomeAccounts(featuredAccounts, sort);
  const sortedAllAccounts = sortHomeAccounts(allAccounts, sort);
  const spotlightAccount = sortedFeaturedAccounts[0] ?? sortedAllAccounts[0] ?? null;
  const bannerAccounts = (
    sortedFeaturedAccounts.length ? sortedFeaturedAccounts : sortedAllAccounts
  ).slice(1, 5);
  const featuredGuides = blogPosts.slice(0, 3);
  const jsonLdData = [
    buildWebPageSchema({
      name: "OMG3Q Shop",
      description:
        "Trang chủ OMG3Q Shop với danh sách acc đang bán, bộ lọc nhanh theo server và các hướng dẫn mua acc an toàn.",
      path: "/",
      image: HOME_BANNER_SOURCES.tablet,
    }),
    buildBreadcrumbSchema([{ name: "Trang chủ", path: "/" }]),
    buildItemListSchema("/", sortedAllAccounts),
    buildFaqSchema(homeFaqs),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  const serverOptions: SearchableSelectOption[] = servers.map((server) => ({
    value: server.code,
    label: server.name,
    keywords: [server.code, server.name],
  }));

  return (
    <>
      <JsonLd data={jsonLdData} />

      <div className={styles.page}>
        <main>
          <section className={styles.hero}>
            <div className={`container ${styles.heroInner}`}>
              <div
                className={[
                  styles.bannerShell,
                  HOME_BANNER_SOURCES.desktop ? styles.bannerShellFullWidth : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {HOME_BANNER_SOURCES.desktop ? (
                  <article className={styles.bannerFrame}>
                    <Link href={HARD_CODED_HOME_BANNER_HREF} className={styles.bannerImageLink}>
                      <picture>
                        <source
                          media="(max-width: 767px)"
                          srcSet={HOME_BANNER_SOURCES.mobile}
                        />
                        <source
                          media="(max-width: 1180px)"
                          srcSet={HOME_BANNER_SOURCES.tablet}
                        />
                        <img
                          src={HOME_BANNER_SOURCES.desktop}
                          alt={HARD_CODED_HOME_BANNER_ALT}
                          className={styles.bannerImage}
                        />
                      </picture>
                    </Link>
                  </article>
                ) : (
                  <article className={styles.bannerFrame}>
                    <div className={styles.bannerFallback}>
                      <div className={styles.bannerContent}>
                        <div className={styles.bannerCopy}>
                          <span className={styles.bannerKicker}>Giao dịch chính chủ</span>
                          <h2 className={styles.bannerFallbackTitle}>
                            Acc đẹp, ảnh thật, chốt nhanh trong ngày
                          </h2>
                          <p className={styles.bannerFallbackText}>
                            Những tài khoản nổi bật sẽ được đưa lên khu vực này để
                            bạn xem nhanh các acc đáng chú ý nhất trên shop.
                          </p>
                          <div className={styles.bannerActions}>
                            <Link href="/accounts" className={styles.bannerPrimary}>
                              Xem toàn bộ acc
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
                                <span className={styles.spotlightBadge}>
                                  VIP {spotlightAccount.vipLevel}
                                </span>
                              </div>
                              <div className={styles.spotlightBody}>
                                <span className={styles.spotlightLabel}>Acc nổi bật</span>
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
                              <h3>Kho acc đang được cập nhật thêm</h3>
                              <p>Shop sẽ đưa những acc nổi bật nhất lên đây để bạn xem nhanh.</p>
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
                        Shop mua bán acc OMG3Q uy tín, rõ ảnh và rõ giá
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
                <p className={styles.listingSummary}>
                  Đang hiển thị toàn bộ {sortedAllAccounts.length.toLocaleString("vi-VN")} acc
                  đang bán trên shop.
                </p>
              </div>
              <HomeSortControl value={sort} className={styles.sortBox} />
            </div>

            <AccountGrid
              items={sortedAllAccounts}
              emptyMessage="Hiện chưa có tài khoản đang bán. Bạn có thể quay lại sau hoặc liên hệ shop để được tư vấn nhanh."
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

          <section className={`${styles.section} ${styles.guidesSection}`}>
            <div className={styles.guidesHead}>
              <div>
                <span className={styles.sectionEyebrow}>Cẩm nang nên đọc trước</span>
                <h2 className={styles.sectionTitle}>
                  Nội dung giúp chốt acc <span>đúng nhu cầu hơn</span>
                </h2>
                <p className={styles.guidesText}>
                  Những bài viết này giúp bạn hiểu cách mua acc an toàn, so sánh
                  ngân sách và chọn đúng acc trước khi chốt giao dịch.
                </p>
              </div>

              <div className={styles.guidesActions}>
                <Link href="/blog" className={styles.guidesPrimary}>
                  Xem toàn bộ blog
                </Link>
                <Link href="/bang-gia-nick-omg3q" className={styles.guidesSecondary}>
                  Xem bảng giá
                </Link>
              </div>
            </div>

            <div className={styles.guidesGrid}>
              {featuredGuides.map((post) => (
                <article key={post.slug} className={styles.guideCard}>
                  <div className={styles.guideMeta}>
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className={styles.guideTitle}>{post.title}</h3>
                  <p className={styles.guideDescription}>{post.description}</p>
                  <Link href={`/blog/${post.slug}`} className={styles.guideLink}>
                    Đọc bài viết
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.faqSection}`}>
            <div className={styles.faqHead}>
              <span className={styles.sectionEyebrow}>Hỏi đáp nhanh</span>
              <h2 className={styles.sectionTitle}>
                FAQ khi tìm và mua <span>acc OMG3Q</span>
              </h2>
              <p className={styles.guidesText}>
                Tổng hợp những câu hỏi người mua hay gặp để bạn nắm nhanh thông tin
                trước khi chọn acc.
              </p>
            </div>

            <div className={styles.faqGrid}>
              {homeFaqs.map((item) => (
                <article key={item.question} className={styles.faqCard}>
                  <h3 className={styles.faqQuestion}>{item.question}</h3>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </article>
              ))}
            </div>

            <div className={styles.faqLinks}>
              <Link href="/accounts" className={styles.faqLink}>
                Mở danh sách acc OMG3Q
              </Link>
              <Link href="/blog/cach-mua-nick-omg3q-an-toan" className={styles.faqLink}>
                Xem checklist mua acc an toàn
              </Link>
              <Link href="/bang-gia-nick-omg3q" className={styles.faqLink}>
                Tham khảo bảng giá
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
