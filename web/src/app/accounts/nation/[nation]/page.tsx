import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccountsWithFilters, getNationCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";
import type { NationCode } from "@/lib/types";

export const revalidate = 300;
const PAGE_LIMIT = 16;

const nationLabels: Record<NationCode, string> = {
  nguy: "Ngụy",
  thuc: "Thục",
  ngo: "Ngô",
};

type NationLandingPageProps = {
  params: Promise<{ nation: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildLandingPath(nation: string, page: number) {
  return page > 1 ? `/accounts/nation/${nation}?page=${page}` : `/accounts/nation/${nation}`;
}

function buildPageItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
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

export async function generateStaticParams() {
  const nations = await getNationCodes();
  return nations.map((nation) => ({ nation }));
}

export async function generateMetadata({ params }: NationLandingPageProps) {
  const { nation } = await params;
  const nationName = nationLabels[nation as NationCode];

  if (!nationName) {
    return createMetadata({
      title: "Nhóm quốc gia không tồn tại",
      description: "Landing page không hợp lệ.",
      path: `/accounts/nation/${nation}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `Acc OMG3Q quốc gia ${nationName}`,
    description: `Tổng hợp acc OMG3Q quốc gia ${nationName} để xem nhanh đội hình, VIP và giá bán phù hợp.`,
    path: `/accounts/nation/${nation}`,
    keywords: [
      `acc omg3q ${nationName.toLowerCase()}`,
      `mua acc omg3q ${nationName.toLowerCase()}`,
      `nick omg3q ${nationName.toLowerCase()}`,
    ],
  });
}

export default async function NationLandingPage({
  params,
  searchParams,
}: NationLandingPageProps) {
  const { nation } = await params;
  const nationName = nationLabels[nation as NationCode];

  if (!nationName) {
    notFound();
  }

  const page = parsePage(firstValue((await searchParams).page));
  const result = await getAccountsWithFilters({
    nation,
    page,
    limit: PAGE_LIMIT,
    sort: "newest",
  });

  if (result.totalPages > 0 && result.page > result.totalPages) {
    redirect(buildLandingPath(nation, result.totalPages));
  }

  const items = result.items;

  if (!items.length) {
    return (
      <MarketingShell
        eyebrow={`Quốc gia ${nationName}`}
        title={`Hiện chưa có acc OMG3Q quốc gia ${nationName}`}
        description="Danh sách sẽ được cập nhật sớm. Bạn có thể xem các quốc gia khác hoặc quay lại trang tổng hợp để lọc nhanh hơn."
        metrics={[
          { label: "Quốc gia", value: nationName },
          { label: "Trạng thái", value: "Đang cập nhật" },
          { label: "Gợi ý", value: "Xem nhóm khác" },
        ]}
        sectionTitle="Bạn có thể làm gì tiếp theo"
        sectionText="Nếu muốn chốt acc sớm, hãy xem danh sách tổng để lọc theo server, giá hoặc nhắn shop để được tư vấn."
        bullets={[
          "Mở danh sách đầy đủ để lọc theo server và mức giá.",
          "Xem thêm các quốc gia khác đang có tài khoản phù hợp.",
          "Liên hệ shop để được gửi các acc gần đúng nhu cầu.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Về danh sách tổng"
      />
    );
  }

  const startItem = (result.page - 1) * result.limit + 1;
  const endItem = startItem + items.length - 1;
  const paginationItems = buildPageItems(result.page, result.totalPages);
  const listingPath = buildLandingPath(nation, result.page);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách acc", path: "/accounts" },
            { name: nationName, path: `/accounts/nation/${nation}` },
          ]),
          buildItemListSchema(listingPath, items),
        ]}
      />
      <MarketingShell
        eyebrow="Danh sách theo quốc gia"
        title={`Acc OMG3Q quốc gia ${nationName} đang bán`}
        description={`Tổng hợp các tài khoản ${nationName} để bạn xem nhanh đội hình, VIP và giá bán phù hợp.`}
        metrics={[
          { label: "Quốc gia", value: nationName },
          { label: "Số acc", value: String(result.total) },
          { label: "Trang", value: `${result.page}/${result.totalPages || 1}` },
        ]}
        sectionTitle="Phù hợp với ai"
        sectionText="Trang này phù hợp khi bạn đã quen một quốc gia và muốn rút ngắn thời gian so sánh trước khi chốt acc."
        bullets={[
          "Xem nhanh các acc cùng nhóm tướng quen dùng.",
          "Dễ so sánh mức giá giữa các tài khoản cùng quốc gia.",
          "Mở từng trang chi tiết để kiểm tra ảnh và mô tả trước khi chốt.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem toàn bộ acc"
      />
      <div className={styles.stack}>
        <p className={styles.resultSummary}>
          Hiển thị {startItem}-{endItem} / {result.total} acc thuộc nhóm {nationName}.
        </p>
        <AccountGrid items={items} />

        {result.totalPages > 1 ? (
          <nav className={styles.pagination} aria-label="Phân trang danh sách acc theo quốc gia">
            <div className={styles.paginationControls}>
              <Link
                href={buildLandingPath(nation, 1)}
                className={styles.pageNav}
                aria-disabled={result.page === 1}
              >
                Đầu
              </Link>

              <Link
                href={buildLandingPath(nation, Math.max(1, result.page - 1))}
                className={styles.pageNav}
                aria-disabled={result.page === 1}
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
                      href={buildLandingPath(nation, item)}
                      className={item === result.page ? styles.pageCurrent : styles.pageLink}
                    >
                      {item}
                    </Link>
                  )
                )}
              </div>

              <Link
                href={buildLandingPath(nation, Math.min(result.totalPages, result.page + 1))}
                className={styles.pageNav}
                aria-disabled={result.page === result.totalPages}
              >
                Sau
              </Link>

              <Link
                href={buildLandingPath(nation, result.totalPages)}
                className={styles.pageNav}
                aria-disabled={result.page === result.totalPages}
              >
                Cuối
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </>
  );
}
