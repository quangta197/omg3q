import Link from "next/link";
import { AdminStatusQuickUpdate } from "@/components/admin/AdminStatusQuickUpdate";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";
import { requireAdminPageSession } from "@/lib/admin-auth";
import {
  getAdminAccountFormOptions,
  getAdminAccountsList,
  getAdminAccountsOverview,
  type AdminAccountListFilters,
  type AdminAccountListResult,
  type AdminAccountStatus,
} from "@/lib/admin-accounts";
import { formatPrice } from "@/lib/seo";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: Array<{
  value: "" | AdminAccountStatus;
  label: string;
}> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "available", label: "Đang bán" },
  { value: "reserved", label: "Đang giữ" },
  { value: "sold", label: "Đã bán" },
  { value: "hidden", label: "Ẩn" },
];

const FEATURED_OPTIONS: Array<{
  value: "" | NonNullable<AdminAccountListFilters["featured"]>;
  label: string;
}> = [
  { value: "", label: "Nổi bật + thường" },
  { value: "featured", label: "Chỉ nổi bật" },
  { value: "standard", label: "Chỉ thường" },
];

const SORT_OPTIONS: Array<{
  value: NonNullable<AdminAccountListFilters["sort"]>;
  label: string;
}> = [
  { value: "updated_desc", label: "Mới cập nhật" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "title_asc", label: "A-Z" },
];

const LIMIT_OPTIONS = [20, 50, 100];

type SearchParamValue = string | string[] | undefined;

type AdminAccountsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

function SetupNotice() {
  return (
    <section className={styles.setupCard}>
      <h2>Thiếu cấu hình admin</h2>
      <p>
        CMS cần `SUPABASE_SERVICE_ROLE_KEY` để tạo nick, lọc dữ liệu và upload ảnh
        lên storage.
      </p>
      <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code>
      <code>SUPABASE_STORAGE_BUCKET=account-images</code>
    </section>
  );
}

function getFirstSearchParam(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchParam(value: SearchParamValue) {
  return getFirstSearchParam(value)?.trim() || undefined;
}

function normalizePositiveInteger(value: SearchParamValue, fallback: number) {
  const parsedValue = Number(getFirstSearchParam(value));

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function parseStatus(value: SearchParamValue): AdminAccountStatus | undefined {
  const normalizedValue = normalizeSearchParam(value);

  if (
    normalizedValue === "available" ||
    normalizedValue === "reserved" ||
    normalizedValue === "sold" ||
    normalizedValue === "hidden"
  ) {
    return normalizedValue;
  }

  return undefined;
}

function parseFeatured(
  value: SearchParamValue
): AdminAccountListFilters["featured"] | undefined {
  const normalizedValue = normalizeSearchParam(value);

  if (normalizedValue === "featured" || normalizedValue === "standard") {
    return normalizedValue;
  }

  return undefined;
}

function parseSort(
  value: SearchParamValue
): NonNullable<AdminAccountListFilters["sort"]> {
  const normalizedValue = normalizeSearchParam(value);

  if (
    normalizedValue === "price_desc" ||
    normalizedValue === "price_asc" ||
    normalizedValue === "title_asc"
  ) {
    return normalizedValue;
  }

  return "updated_desc";
}

function buildFiltersFromSearchParams(
  params: Record<string, SearchParamValue>
): AdminAccountListFilters {
  return {
    search: normalizeSearchParam(params.search),
    status: parseStatus(params.status),
    featured: parseFeatured(params.featured),
    serverId: normalizeSearchParam(params.server),
    nationId: normalizeSearchParam(params.nation),
    sort: parseSort(params.sort),
    page: normalizePositiveInteger(params.page, 1),
    limit: normalizePositiveInteger(params.limit, 20),
  };
}

function buildAccountsPageHref(
  filters: AdminAccountListResult["appliedFilters"],
  overrides: Partial<AdminAccountListFilters> = {}
) {
  const nextFilters: AdminAccountListFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (nextFilters.search) {
    params.set("search", nextFilters.search);
  }

  if (nextFilters.status) {
    params.set("status", nextFilters.status);
  }

  if (nextFilters.featured) {
    params.set("featured", nextFilters.featured);
  }

  if (nextFilters.serverId) {
    params.set("server", nextFilters.serverId);
  }

  if (nextFilters.nationId) {
    params.set("nation", nextFilters.nationId);
  }

  if (nextFilters.sort && nextFilters.sort !== "updated_desc") {
    params.set("sort", nextFilters.sort);
  }

  if (nextFilters.limit && nextFilters.limit !== 20) {
    params.set("limit", String(nextFilters.limit));
  }

  if (nextFilters.page && nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  const queryString = params.toString();

  return queryString ? `/admin/accounts?${queryString}` : "/admin/accounts";
}

function getVisibleRangeStart(page: number, limit: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return (page - 1) * limit + 1;
}

function getVisibleRangeEnd(page: number, limit: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.min(page * limit, total);
}

function getPageItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

function formatUpdatedDate(value: string | null) {
  if (!value) {
    return "Chưa cập nhật";
  }

  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminAccountsPage({
  searchParams,
}: AdminAccountsPageProps) {
  await requireAdminPageSession("/admin/accounts");

  if (!hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const resolvedSearchParams = await searchParams;
  const filters = buildFiltersFromSearchParams(resolvedSearchParams);
  const [options, overview, result] = await Promise.all([
    getAdminAccountFormOptions(),
    getAdminAccountsOverview(),
    getAdminAccountsList(filters),
  ]);
  const serverSelectOptions: SearchableSelectOption[] = options.servers.map((server) => ({
    value: server.id,
    label: server.name,
    keywords: [server.code, server.name],
  }));

  const pageItems = getPageItems(result.page, result.totalPages);
  const visibleRangeStart = getVisibleRangeStart(result.page, result.limit, result.total);
  const visibleRangeEnd = getVisibleRangeEnd(result.page, result.limit, result.total);

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.heading}>Danh sách tài khoản</h2>
          <p className={styles.subheading}>
            Chuyển sang kiểu quản trị theo bảng để tìm, lọc và sửa 100-200 nick dễ
            hơn hẳn card grid.
          </p>
        </div>
        <div className={styles.toolbarActions}>
          <div className={styles.resultMeta}>
            {result.total > 0
              ? `Đang xem ${visibleRangeStart}-${visibleRangeEnd} / ${result.total} nick`
              : "Chưa có nick nào theo bộ lọc hiện tại"}
          </div>
          <Link href="/admin/accounts/new" className={styles.primaryAction}>
            Tạo tài khoản mới
          </Link>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Tổng nick</span>
          <strong className={styles.summaryValue}>{overview.total}</strong>
          <span className={styles.summaryHint}>Toàn bộ kho dữ liệu admin</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Đang bán</span>
          <strong className={styles.summaryValue}>
            {overview.available + overview.reserved}
          </strong>
          <span className={styles.summaryHint}>
            {overview.available} đang bán, {overview.reserved} đang giữ
          </span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Nổi bật</span>
          <strong className={styles.summaryValue}>{overview.featured}</strong>
          <span className={styles.summaryHint}>Nick đang được đẩy nổi bật</span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Đã bán / Ẩn</span>
          <strong className={styles.summaryValue}>
            {overview.sold + overview.hidden}
          </strong>
          <span className={styles.summaryHint}>
            {overview.sold} đã bán, {overview.hidden} đang ẩn
          </span>
        </article>
      </div>

      <div className={styles.filtersCard}>
        <form className={styles.filtersForm} action="/admin/accounts" method="get">
          <label className={styles.fieldWide}>
            <span className={styles.label}>Tìm theo tiêu đề hoặc slug</span>
            <input
              className={styles.input}
              type="search"
              name="search"
              defaultValue={result.appliedFilters.search ?? ""}
              placeholder="VD: vip 12, s1, slug cụ thể..."
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Trạng thái</span>
            <select
              className={styles.select}
              name="status"
              defaultValue={result.appliedFilters.status ?? ""}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Loại hiển thị</span>
            <select
              className={styles.select}
              name="featured"
              defaultValue={result.appliedFilters.featured ?? ""}
            >
              {FEATURED_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Server</span>
            <SearchableSelect
              key={result.appliedFilters.serverId ?? "all-servers"}
              id="admin-server-filter"
              name="server"
              defaultValue={result.appliedFilters.serverId ?? ""}
              options={serverSelectOptions}
              emptyLabel="Tất cả server"
              placeholder="Tìm server như S930"
              ariaLabel="Lọc theo server"
              inputClassName={styles.select}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Quốc gia</span>
            <select
              className={styles.select}
              name="nation"
              defaultValue={result.appliedFilters.nationId ?? ""}
            >
              <option value="">Tất cả quốc gia</option>
              {options.nations.map((nation) => (
                <option key={nation.id} value={nation.id}>
                  {nation.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Sắp xếp</span>
            <select
              className={styles.select}
              name="sort"
              defaultValue={result.appliedFilters.sort}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Số dòng / trang</span>
            <select
              className={styles.select}
              name="limit"
              defaultValue={String(result.appliedFilters.limit)}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.filterActions}>
            <button className={styles.filterButton} type="submit">
              Lọc danh sách
            </button>
            <Link href="/admin/accounts" className={styles.resetLink}>
              Xóa bộ lọc
            </Link>
          </div>
        </form>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Kho dữ liệu nick</h3>
            <p className={styles.sectionText}>
              Tập trung vào thao tác tìm nhanh, đổi trạng thái ngay trong bảng và chỉ
              vào màn sửa khi thật sự cần chỉnh sâu.
            </p>
          </div>
          <div className={styles.tableContext}>
            Trang {result.totalPages === 0 ? 0 : result.page} / {result.totalPages}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Trạng thái</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Cập nhật</th>
                <th>Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td className={styles.emptyState} colSpan={6}>
                    Không có nick nào khớp bộ lọc. Hãy đổi từ khóa hoặc bỏ bớt điều
                    kiện lọc.
                  </td>
                </tr>
              ) : (
                result.items.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className={styles.accountCell}>
                        <div className={styles.accountTitleRow}>
                          <strong className={styles.accountTitle}>{account.title}</strong>
                          {account.thumbnailUrl ? (
                            <span className={styles.thumbHint}>Có ảnh</span>
                          ) : (
                            <span className={styles.thumbHintMuted}>Chưa có ảnh</span>
                          )}
                        </div>
                        <div className={styles.accountMeta}>
                          <span>{account.serverName || "Chưa có server"}</span>
                          <span>{account.nationName || "Chưa có quốc gia"}</span>
                          <code>{account.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td>
                      <AdminStatusQuickUpdate
                        accountId={account.id}
                        initialStatus={account.status}
                      />
                    </td>
                    <td>
                      <span
                        className={
                          account.isFeatured ? styles.featuredBadge : styles.standardBadge
                        }
                      >
                        {account.isFeatured ? "Nổi bật" : "Thường"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.priceStack}>
                        <strong className={styles.price}>{formatPrice(account.price)}</strong>
                        {account.installmentPrice ? (
                          <span className={styles.priceSub}>
                            Góp từ {formatPrice(account.installmentPrice)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={styles.updatedAt}>
                        {formatUpdatedDate(account.updatedAt)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link
                          href={`/admin/accounts/${account.id}`}
                          className={styles.editLink}
                        >
                          Sửa dữ liệu
                        </Link>
                        <Link
                          href={`/accounts/${account.slug}`}
                          className={styles.previewLink}
                        >
                          Xem trang bán
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {result.totalPages > 1 ? (
          <nav className={styles.pagination}>
            <Link
              href={buildAccountsPageHref(result.appliedFilters, {
                page: Math.max(1, result.page - 1),
              })}
              className={`${styles.pageLink} ${
                result.page === 1 ? styles.pageLinkDisabled : ""
              }`}
              aria-disabled={result.page === 1}
              tabIndex={result.page === 1 ? -1 : undefined}
            >
              Trang trước
            </Link>

            <div className={styles.pageNumbers}>
              {pageItems.map((page) => (
                <Link
                  key={page}
                  href={buildAccountsPageHref(result.appliedFilters, { page })}
                  className={`${styles.pageLink} ${
                    page === result.page ? styles.pageLinkActive : ""
                  }`}
                >
                  {page}
                </Link>
              ))}
            </div>

            <Link
              href={buildAccountsPageHref(result.appliedFilters, {
                page: Math.min(result.totalPages, result.page + 1),
              })}
              className={`${styles.pageLink} ${
                result.page === result.totalPages ? styles.pageLinkDisabled : ""
              }`}
              aria-disabled={result.page === result.totalPages}
              tabIndex={result.page === result.totalPages ? -1 : undefined}
            >
              Trang sau
            </Link>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
