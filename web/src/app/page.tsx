import Image from "next/image";
import Link from "next/link";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { HomeSortControl } from "@/components/marketing/HomeSortControl";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccountsWithFilters, getFeaturedAccounts, getServers } from "@/lib/accounts";
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

const HOME_PAGE_SIZE = 12;

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
  { label: "Acc VIP từ 3tr", href: "/accounts/vip" },
  { label: "Hướng dẫn mua", href: "/huong-dan-mua-acc-omg3q" },
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

function parseHomePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
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

function buildHomePath({
  sort,
  page,
}: {
  sort: AccountSort;
  page: number;
}) {
  const params = new URLSearchParams();

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

function buildHomePageItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: Array<number | "ellipsis"> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const sort = parseHomeSort(firstValue(params.sort));
  const page = parseHomePage(firstValue(params.page));
  const [featuredAccounts, accountResult, servers] = await Promise.all([
    getFeaturedAccounts(6),
    getAccountsWithFilters({
      sort,
      page,
      limit: HOME_PAGE_SIZE,
    }),
    getServers(),
  ]);
  const sortedFeaturedAccounts = sortHomeAccounts(featuredAccounts, sort);
  const listedAccounts = accountResult.items;
  const spotlightAccount = sortedFeaturedAccounts[0] ?? listedAccounts[0] ?? null;
  const bannerAccounts = (
    sortedFeaturedAccounts.length ? sortedFeaturedAccounts : listedAccounts
  ).slice(1, 5);
  const featuredGuides = blogPosts.slice(0, 3);
  const startItem =
    accountResult.total > 0 ? (accountResult.page - 1) * accountResult.limit + 1 : 0;
  const endItem =
    accountResult.total > 0 ? startItem + accountResult.items.length - 1 : 0;
  const paginationItems = buildHomePageItems(accountResult.page, accountResult.totalPages);
  const jsonLdData = [
    buildWebPageSchema({
      name: "OMG3Q Shop",
      description:
        "Trang chủ OMG3Q Shop với danh sách acc đang bán, bộ lọc nhanh theo server và các hướng dẫn mua acc an toàn.",
      path: "/",
      image: HOME_BANNER_SOURCES.tablet,
    }),
    buildBreadcrumbSchema([{ name: "Trang chủ", path: "/" }]),
    buildItemListSchema(buildHomePath({ sort, page: accountResult.page }), listedAccounts),
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

              <div className={styles.heroLead}>
                <span className={styles.eyebrow}>Shop acc OMG3Q uy tín</span>
                <h1 className={styles.heroTitle}>
                  Mua acc OMG3Q có ảnh thật, giá rõ và hỗ trợ bàn giao an toàn
                </h1>
                <p className={styles.heroText}>
                  Chọn nhanh nick OMG3Q theo server, quốc gia, VIP và tầm giá. Mỗi
                  tài khoản đều ưu tiên mô tả rõ tình trạng, gallery thực tế và kênh
                  liên hệ trực tiếp để chốt giao dịch gọn hơn.
                </p>
                <div className={styles.heroProof}>
                  <span>Ảnh thật từng acc</span>
                  <span>Giữ acc qua Zalo</span>
                  <span>Hỗ trợ sau bàn giao</span>
                </div>
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
                  {accountResult.total > 0
                    ? `Hiển thị ${startItem}-${endItem} / ${accountResult.total.toLocaleString(
                        "vi-VN"
                      )} acc đang bán. Bấm sang trang tiếp để xem thêm tài khoản phù hợp.`
                    : "Hiện chưa có tài khoản đang bán trên shop."}
                </p>
              </div>
              <HomeSortControl value={sort} className={styles.sortBox} />
            </div>

            <AccountGrid
              items={listedAccounts}
              emptyMessage="Hiện chưa có tài khoản đang bán. Bạn có thể quay lại sau hoặc liên hệ shop để được tư vấn nhanh."
            />

            {accountResult.totalPages > 1 ? (
              <nav className={styles.pagination} aria-label="Phân trang acc trang chủ">
                <Link
                  href={buildHomePath({
                    sort,
                    page: Math.max(1, accountResult.page - 1),
                  })}
                  className={`${styles.pageNav} ${
                    accountResult.page === 1 ? styles.pageNavDisabled : ""
                  }`}
                  aria-disabled={accountResult.page === 1}
                  tabIndex={accountResult.page === 1 ? -1 : undefined}
                >
                  Trước
                </Link>

                <div className={styles.pageList}>
                  {paginationItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHomePath({ sort, page: item })}
                        className={
                          item === accountResult.page
                            ? styles.pageCurrent
                            : styles.pageLink
                        }
                        aria-current={item === accountResult.page ? "page" : undefined}
                      >
                        {item}
                      </Link>
                    )
                  )}
                </div>

                <Link
                  href={buildHomePath({
                    sort,
                    page: Math.min(accountResult.totalPages, accountResult.page + 1),
                  })}
                  className={`${styles.pageNav} ${
                    accountResult.page === accountResult.totalPages
                      ? styles.pageNavDisabled
                      : ""
                  }`}
                  aria-disabled={accountResult.page === accountResult.totalPages}
                  tabIndex={
                    accountResult.page === accountResult.totalPages ? -1 : undefined
                  }
                >
                  Sau
                </Link>
              </nav>
            ) : null}

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
              <Link href="/huong-dan-mua-acc-omg3q" className={styles.faqLink}>
                Xem checklist mua acc an toàn
              </Link>
              <Link href="/bang-gia-nick-omg3q" className={styles.faqLink}>
                Tham khảo bảng giá
              </Link>
              <Link href="/quy-trinh-giao-dich" className={styles.faqLink}>
                Quy trình giao dịch
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
