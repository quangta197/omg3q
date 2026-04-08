import Link from "next/link";
import type { Metadata } from "next";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAccountsWithFilters,
  getNations,
  getServers,
} from "@/lib/accounts";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import type { AccountListFilters, AccountSort } from "@/lib/types";
import sharedStyles from "../route-layout.module.css";
import styles from "./page.module.css";

export const revalidate = 300;

const DEFAULT_LIMIT = 12;

const sortOptions: Array<{ value: AccountSort; label: string }> = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type AccountsPageProps = {
  searchParams: SearchParams;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePositiveNumber(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parseSort(value: string | undefined): AccountSort {
  if (value === "price_asc" || value === "price_desc") {
    return value;
  }

  return "newest";
}

function normalizeFilters(
  params: Record<string, string | string[] | undefined>
): AccountListFilters {
  const search = firstValue(params.search)?.trim();
  const server = firstValue(params.server)?.trim().toLowerCase();
  const nation = firstValue(params.nation)?.trim().toLowerCase();
  const sort = parseSort(firstValue(params.sort));
  const page = Math.max(1, parsePositiveNumber(firstValue(params.page)) ?? 1);

  let priceMin = parsePositiveNumber(firstValue(params.price_min));
  let priceMax = parsePositiveNumber(firstValue(params.price_max));

  if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
  }

  return {
    search: search || undefined,
    server: server || undefined,
    nation: nation || undefined,
    priceMin,
    priceMax,
    sort,
    page,
    limit: DEFAULT_LIMIT,
  };
}

function buildAccountsPath(filters: AccountListFilters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.server) {
    params.set("server", filters.server);
  }

  if (filters.nation) {
    params.set("nation", filters.nation);
  }

  if (filters.priceMin !== undefined) {
    params.set("price_min", String(filters.priceMin));
  }

  if (filters.priceMax !== undefined) {
    params.set("price_max", String(filters.priceMax));
  }

  if (filters.sort && filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();

  return query ? `/accounts?${query}` : "/accounts";
}

function isDefaultListing(filters: AccountListFilters) {
  return !(
    filters.search ||
    filters.server ||
    filters.nation ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    (filters.sort && filters.sort !== "newest") ||
    (filters.page && filters.page > 1)
  );
}

function formatCompactNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    })}k`;
  }

  return value.toLocaleString("vi-VN");
}

function formatRangeLabel(min: number | undefined, max: number | undefined) {
  if (min !== undefined && max !== undefined) {
    return `${formatCompactNumber(min)} - ${formatCompactNumber(max)}`;
  }

  if (min !== undefined) {
    return `Từ ${formatCompactNumber(min)}`;
  }

  if (max !== undefined) {
    return `Dưới ${formatCompactNumber(max)}`;
  }

  return "";
}

function buildPageItems(currentPage: number, totalPages: number) {
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

function removeFilter(
  filters: AccountListFilters,
  keys: Array<keyof AccountListFilters>
) {
  const nextFilters: AccountListFilters = { ...filters, page: 1 };

  keys.forEach((key) => {
    delete nextFilters[key];
  });

  return buildAccountsPath(nextFilters);
}

export async function generateMetadata({
  searchParams,
}: AccountsPageProps): Promise<Metadata> {
  const filters = normalizeFilters(await searchParams);
  const hasCustomState = !isDefaultListing(filters);
  const title = filters.search
    ? `Kết quả mua acc OMG3Q cho "${filters.search}" | Shop acc OMG3Q`
    : hasCustomState
      ? "Lọc acc OMG3Q theo server, giá và quốc gia | ShopOMG3Q"
      : "Mua Acc OMG3Q | Shop Acc OMG3Q Theo Server, VIP, Giá";
  const description = hasCustomState
    ? "Kết quả lọc acc OMG3Q theo server, quốc gia và giá để bạn chọn nhanh acc phù hợp trước khi chốt."
    : "Danh sách acc OMG3Q đang bán theo server, quốc gia, VIP và mức giá. Có ảnh thật, mô tả rõ, hỗ trợ giữ acc và tư vấn chốt nhanh.";

  return createMetadata({
    title,
    description,
    path: "/accounts",
    keywords: [
      "mua acc omg3q",
      "danh sách acc omg3q",
      "mua acc omg3q theo server",
      "lọc acc omg3q",
      "mua nick omg3q",
      "shop acc omg3q",
    ],
    noIndex: hasCustomState,
  });
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
  const filters = normalizeFilters(await searchParams);
  const [servers, nations, result] = await Promise.all([
    getServers(),
    getNations(),
    getAccountsWithFilters(filters),
  ]);

  const serverSelectOptions: SearchableSelectOption[] = servers.map((server) => ({
    value: server.code,
    label: server.name,
    keywords: [server.code, server.name],
  }));

  const listingPath = buildAccountsPath(result.appliedFilters);
  const serverName =
    servers.find((item) => item.code === result.appliedFilters.server)?.name ?? null;
  const nationName =
    nations.find((item) => item.code === result.appliedFilters.nation)?.name ?? null;

  const activeFilters = [
    result.appliedFilters.search
      ? {
          label: `Từ khóa: ${result.appliedFilters.search}`,
          href: removeFilter(result.appliedFilters, ["search"]),
        }
      : null,
    serverName
      ? {
          label: `Server: ${serverName}`,
          href: removeFilter(result.appliedFilters, ["server"]),
        }
      : null,
    nationName
      ? {
          label: `Quốc gia: ${nationName}`,
          href: removeFilter(result.appliedFilters, ["nation"]),
        }
      : null,
    result.appliedFilters.priceMin !== undefined ||
    result.appliedFilters.priceMax !== undefined
      ? {
          label: `Giá: ${formatRangeLabel(
            result.appliedFilters.priceMin,
            result.appliedFilters.priceMax
          )}`,
          href: removeFilter(result.appliedFilters, ["priceMin", "priceMax"]),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const startItem = result.total > 0 ? (result.page - 1) * result.limit + 1 : 0;
  const endItem = result.total > 0 ? startItem + result.items.length - 1 : 0;
  const paginationItems = buildPageItems(result.page, result.totalPages);
  const currentSortLabel =
    sortOptions.find((item) => item.value === result.appliedFilters.sort)?.label ??
    sortOptions[0].label;
  const filterSummaryLabel = activeFilters.length
    ? `${activeFilters.length} điều kiện đang áp dụng`
    : "Đang xem toàn bộ danh sách";

  return (
    <main className={`${sharedStyles.stack} ${styles.page}`}>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách acc", path: "/accounts" },
          ]),
          buildItemListSchema(listingPath, result.items),
        ]}
      />

      <header className={styles.pageIntro}>
        <div>
          <span className={styles.resultsEyebrow}>Shop acc OMG3Q</span>
          <h1 className={styles.pageTitle}>
            Mua acc OMG3Q theo server, quốc gia và tầm giá phù hợp
          </h1>
          <p className={styles.pageDescription}>
            Mở danh sách để lọc nhanh theo server, giá, quốc gia và tìm đúng acc
            phù hợp với nhu cầu của bạn.
          </p>
        </div>

        <div className={styles.pageLinks}>
          <Link href="/bang-gia-nick-omg3q" className={styles.pageLinkPrimary}>
            Xem bảng giá
          </Link>
          <Link
            href="/blog/cach-mua-nick-omg3q-an-toan"
            className={styles.pageLinkSecondary}
          >
            Cách mua acc an toàn
          </Link>
        </div>
      </header>

      <section className={styles.toolbar}>
        <form className={styles.filterPanel} action="/accounts" method="get">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Bộ lọc chính</span>
              <h2 className={styles.panelTitle}>Khoanh vùng đúng acc cần tìm</h2>
              <p className={styles.panelDescription}>
                Điền từ khóa, chọn server hoặc đặt khung giá để rút ngắn thời gian
                duyệt acc.
              </p>
            </div>

            <div className={styles.panelSummary}>
              <span className={styles.panelSummaryLabel}>Trạng thái lọc</span>
              <strong>{filterSummaryLabel}</strong>
            </div>
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.fieldWide}>
              <label htmlFor="search" className={styles.label}>
                Từ khóa
              </label>
              <input
                id="search"
                name="search"
                type="search"
                className={styles.input}
                defaultValue={result.appliedFilters.search ?? ""}
                placeholder="Tên acc, mô tả hoặc nhu cầu cụ thể"
              />
            </div>

            <div>
              <label htmlFor="server" className={styles.label}>
                Server
              </label>
              <SearchableSelect
                key={result.appliedFilters.server ?? "all-servers"}
                id="server"
                name="server"
                defaultValue={result.appliedFilters.server ?? ""}
                options={serverSelectOptions}
                emptyLabel="Tất cả server"
                placeholder="Tìm server như S930"
                ariaLabel="Lọc theo server"
                inputClassName={styles.select}
              />
            </div>

            <div>
              <label htmlFor="nation" className={styles.label}>
                Quốc gia
              </label>
              <select
                id="nation"
                name="nation"
                className={styles.select}
                defaultValue={result.appliedFilters.nation ?? ""}
              >
                <option value="">Tất cả quốc gia</option>
                {nations.map((nation) => (
                  <option key={nation.id} value={nation.code}>
                    {nation.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price_min" className={styles.label}>
                Giá từ
              </label>
              <FormattedNumberInput
                id="price_min"
                name="price_min"
                className={styles.input}
                defaultValue={result.appliedFilters.priceMin ?? null}
                placeholder="0"
                ariaLabel="Giá từ"
              />
            </div>

            <div>
              <label htmlFor="price_max" className={styles.label}>
                Giá đến
              </label>
              <FormattedNumberInput
                id="price_max"
                name="price_max"
                className={styles.input}
                defaultValue={result.appliedFilters.priceMax ?? null}
                placeholder="5.000.000"
                ariaLabel="Giá đến"
              />
            </div>

            <div>
              <label htmlFor="sort" className={styles.label}>
                Sắp xếp
              </label>
              <select
                id="sort"
                name="sort"
                className={styles.select}
                defaultValue={result.appliedFilters.sort ?? "newest"}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.panelFooter}>
            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                Áp dụng bộ lọc
              </button>
              <Link href="/accounts" className={styles.secondaryButton}>
                Xóa lọc
              </Link>
            </div>
          </div>
        </form>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsBar}>
          <div className={styles.resultsCopy}>
            <span className={styles.resultsEyebrow}>Danh sách đang hiển thị</span>
            <h2 className={styles.resultsTitle}>Tài khoản đang rao bán</h2>
            <p className={styles.resultsText}>
              {result.total > 0
                ? `Hiển thị ${startItem}-${endItem} / ${result.total} acc phù hợp.`
                : "Chưa có acc phù hợp với bộ lọc hiện tại."}
            </p>
          </div>
          <div className={styles.resultsMeta}>
            <span>{currentSortLabel}</span>
            <span>{result.total.toLocaleString("vi-VN")} kết quả</span>
          </div>
        </div>

        {activeFilters.length ? (
          <div className={styles.activeFilters}>
            {activeFilters.map((filter) => (
              <Link key={filter.label} href={filter.href} className={styles.filterChip}>
                {filter.label}
              </Link>
            ))}
          </div>
        ) : null}

        <AccountGrid
          items={result.items}
          emptyMessage="Không tìm thấy acc phù hợp. Hãy thử nới giá hoặc đổi server và quốc gia."
        />

        {result.totalPages > 1 ? (
          <nav className={styles.pagination} aria-label="Phân trang danh sách acc">
            <Link
              href={buildAccountsPath({
                ...result.appliedFilters,
                page: Math.max(1, result.page - 1),
              })}
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
                    href={buildAccountsPath({
                      ...result.appliedFilters,
                      page: item,
                    })}
                    className={
                      item === result.page ? styles.pageCurrent : styles.pageLink
                    }
                  >
                    {item}
                  </Link>
                )
              )}
            </div>

            <Link
              href={buildAccountsPath({
                ...result.appliedFilters,
                page: Math.min(result.totalPages, result.page + 1),
              })}
              className={styles.pageNav}
              aria-disabled={result.page === result.totalPages}
            >
              Sau
            </Link>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
