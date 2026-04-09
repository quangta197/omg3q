import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountsWithFilters, getServerCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";

export const revalidate = 300;
const PAGE_LIMIT = 16;

type ServerLandingPageProps = {
  params: Promise<{ server: string }>;
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

function buildLandingPath(server: string, page: number) {
  return page > 1 ? `/accounts/server/${server}?page=${page}` : `/accounts/server/${server}`;
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
  const servers = await getServerCodes();
  return servers.map((server) => ({ server }));
}

export async function generateMetadata({ params }: ServerLandingPageProps) {
  const { server } = await params;

  return createMetadata({
    title: `Acc OMG3Q ${server.toUpperCase()} uy tín, giá tốt`,
    description: `Tổng hợp acc OMG3Q server ${server.toUpperCase()} với nhiều mức VIP và giá bán để chọn nhanh tài khoản phù hợp.`,
    path: `/accounts/server/${server}`,
    keywords: [`acc omg3q ${server}`, `mua acc omg3q ${server}`, `nick omg3q ${server}`],
  });
}

export default async function ServerLandingPage({
  params,
  searchParams,
}: ServerLandingPageProps) {
  const { server } = await params;
  const page = parsePage(firstValue((await searchParams).page));
  const result = await getAccountsWithFilters({
    server,
    page,
    limit: PAGE_LIMIT,
    sort: "newest",
  });

  if (result.totalPages > 0 && result.page > result.totalPages) {
    redirect(buildLandingPath(server, result.totalPages));
  }

  const items = result.items;

  if (!items.length) {
    return (
      <MarketingShell
        eyebrow={`Server ${server.toUpperCase()}`}
        title={`Hiện chưa có acc OMG3Q ở server ${server.toUpperCase()}`}
        description="Danh sách sẽ được cập nhật sớm. Bạn có thể xem các server khác hoặc quay lại trang tổng hợp để lọc nhanh hơn."
        metrics={[
          { label: "Server", value: server.toUpperCase() },
          { label: "Trạng thái", value: "Đang cập nhật" },
          { label: "Gợi ý", value: "Xem server khác" },
        ]}
        sectionTitle="Bạn có thể làm gì tiếp theo"
        sectionText="Nếu cần acc gấp, hãy mở danh sách tổng để lọc theo giá hoặc liên hệ shop để được tư vấn nhanh."
        bullets={[
          "Mở danh sách đầy đủ để lọc theo giá.",
          "Xem thêm các server đang có nhiều acc hơn.",
          "Nhắn Zalo hoặc Facebook để shop gợi ý tài khoản phù hợp.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Mở danh sách tổng"
      />
    );
  }

  const startItem = (result.page - 1) * result.limit + 1;
  const endItem = startItem + items.length - 1;
  const paginationItems = buildPageItems(result.page, result.totalPages);
  const listingPath = buildLandingPath(server, result.page);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách acc", path: "/accounts" },
            {
              name: `Server ${server.toUpperCase()}`,
              path: `/accounts/server/${server}`,
            },
          ]),
          buildItemListSchema(listingPath, items),
        ]}
      />
      <MarketingShell
        eyebrow="Danh sách theo server"
        title={`Acc OMG3Q server ${server.toUpperCase()} đang bán`}
        description={`Chọn nhanh các tài khoản thuộc server ${server.toUpperCase()}, so sánh giá và tình trạng trước khi chốt.`}
        metrics={[
          { label: "Số acc", value: String(result.total) },
          { label: "Server", value: server.toUpperCase() },
          { label: "Trang", value: `${result.page}/${result.totalPages || 1}` },
        ]}
        sectionTitle="Phù hợp với ai"
        sectionText="Trang này phù hợp khi bạn đã chốt sẵn server và chỉ muốn xem nhanh các acc đang bán trong cùng nhóm."
        bullets={[
          "So sánh nhanh giá bán giữa các acc cùng server.",
          "Dễ chọn tài khoản đúng tiến độ chơi hiện tại.",
          "Có thể mở từng acc để xem ảnh, mô tả và liên hệ ngay.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem toàn bộ acc"
      />
      <div className={styles.stack}>
        <p className={styles.resultSummary}>
          Hiển thị {startItem}-{endItem} / {result.total} acc thuộc server{" "}
          {server.toUpperCase()}.
        </p>
        <AccountGrid items={items} />

        {result.totalPages > 1 ? (
          <nav className={styles.pagination} aria-label="Phân trang danh sách acc theo server">

            <div className={styles.paginationControls}>
              <Link
                href={buildLandingPath(server, 1)}
                className={styles.pageNav}
                aria-disabled={result.page === 1}
              >
                Đầu
              </Link>

              <Link
                href={buildLandingPath(server, Math.max(1, result.page - 1))}
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
                      href={buildLandingPath(server, item)}
                      className={item === result.page ? styles.pageCurrent : styles.pageLink}
                    >
                      {item}
                    </Link>
                  )
                )}
              </div>

              <Link
                href={buildLandingPath(server, Math.min(result.totalPages, result.page + 1))}
                className={styles.pageNav}
                aria-disabled={result.page === result.totalPages}
              >
                Sau
              </Link>

              <Link
                href={buildLandingPath(server, result.totalPages)}
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
