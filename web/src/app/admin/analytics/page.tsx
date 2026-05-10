import Link from "next/link";
import { requireAdminPageSession } from "@/lib/admin-auth";
import { getVisitAnalytics } from "@/lib/analytics";
import { hasSupabaseServiceRole } from "@/lib/supabase-admin";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const DAY_OPTIONS = [7, 30, 90];

type SearchParamValue = string | string[] | undefined;

type AdminAnalyticsPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

function getFirstSearchParam(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseDays(value: SearchParamValue) {
  const parsedValue = Number(getFirstSearchParam(value));

  if (DAY_OPTIONS.includes(parsedValue)) {
    return parsedValue;
  }

  return 30;
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+07:00`).toLocaleDateString("vi-VN", {
    dateStyle: "medium",
  });
}

function buildAnalyticsHref(days: number) {
  return days === 30 ? "/admin/analytics" : `/admin/analytics?days=${days}`;
}

function SetupNotice() {
  return (
    <section className={styles.noticeCard}>
      <h2>Thiếu cấu hình thống kê</h2>
      <p>
        Trang thống kê cần `SUPABASE_SERVICE_ROLE_KEY` để đọc dữ liệu lượt truy
        cập từ Supabase.
      </p>
      <code>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</code>
    </section>
  );
}

function MigrationNotice({ message }: { message: string }) {
  return (
    <section className={styles.noticeCard}>
      <h2>Chưa đọc được dữ liệu lượt truy cập</h2>
      <p>{message}</p>
      <p>
        Nếu đây là lần đầu bật thống kê, hãy chạy phần SQL mới trong
        `database/schema.sql` để tạo bảng `site_visits`.
      </p>
    </section>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  await requireAdminPageSession("/admin/analytics");

  if (!hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const days = parseDays((await searchParams).days);
  let analytics;

  try {
    analytics = await getVisitAnalytics(days);
  } catch (error) {
    return (
      <MigrationNotice
        message={
          error instanceof Error
            ? error.message
            : "Không thể tải thống kê lượt truy cập."
        }
      />
    );
  }

  const maxDailyViews = Math.max(
    1,
    ...analytics.dailyStats.map((item) => item.pageViews)
  );

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.heading}>Thống kê lượt truy cập</h2>
          <p className={styles.subheading}>
            Theo dõi tổng lượt xem trang, khách duy nhất và phân bổ truy cập
            theo từng ngày.
          </p>
        </div>

        <div className={styles.rangeTabs} aria-label="Khoảng thời gian thống kê">
          {DAY_OPTIONS.map((option) => (
            <Link
              key={option}
              href={buildAnalyticsHref(option)}
              className={
                option === analytics.days ? styles.rangeTabActive : styles.rangeTab
              }
            >
              {option} ngày
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Tổng lượt xem</span>
          <strong className={styles.summaryValue}>
            {formatNumber(analytics.totalPageViews)}
          </strong>
          <span className={styles.summaryHint}>Từ khi bắt đầu ghi thống kê</span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Hôm nay</span>
          <strong className={styles.summaryValue}>
            {formatNumber(analytics.todayPageViews)}
          </strong>
          <span className={styles.summaryHint}>
            {formatNumber(analytics.todayUniqueVisitors)} khách duy nhất
          </span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Trong {analytics.days} ngày</span>
          <strong className={styles.summaryValue}>
            {formatNumber(analytics.selectedPageViews)}
          </strong>
          <span className={styles.summaryHint}>
            {formatNumber(analytics.selectedUniqueVisitors)} khách duy nhất
          </span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>7 / 30 ngày</span>
          <strong className={styles.summaryValueCompact}>
            {formatNumber(analytics.last7DaysPageViews)} /{" "}
            {formatNumber(analytics.last30DaysPageViews)}
          </strong>
          <span className={styles.summaryHint}>So nhanh nhịp truy cập gần đây</span>
        </article>
      </div>

      {analytics.isLimited ? (
        <div className={styles.warningCard}>
          Dữ liệu chi tiết đang được giới hạn ở 100.000 dòng mới nhất trong kỳ.
          Tổng lượt vẫn lấy theo count từ Supabase.
        </div>
      ) : null}

      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Lượt truy cập theo ngày</h3>
            <p className={styles.sectionText}>
              Mỗi cột là số lượt xem trang trong ngày theo múi giờ Việt Nam.
            </p>
          </div>
        </div>

        <div className={styles.chart}>
          {analytics.dailyStats.map((item) => {
            const height = Math.max(6, (item.pageViews / maxDailyViews) * 100);

            return (
              <div key={item.date} className={styles.chartItem}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${height}%` }}
                    title={`${formatFullDateLabel(item.date)}: ${formatNumber(
                      item.pageViews
                    )} lượt`}
                  />
                </div>
                <span className={styles.chartValue}>{formatNumber(item.pageViews)}</span>
                <span className={styles.chartLabel}>{formatDateLabel(item.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Chi tiết từng ngày</h3>
              <p className={styles.sectionText}>
                Dùng bảng này để xem ngày nào tăng hoặc giảm rõ.
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Lượt xem</th>
                  <th>Khách duy nhất</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyStats
                  .slice()
                  .reverse()
                  .map((item) => (
                    <tr key={item.date}>
                      <td>{formatFullDateLabel(item.date)}</td>
                      <td>{formatNumber(item.pageViews)}</td>
                      <td>{formatNumber(item.uniqueVisitors)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.sectionTitle}>Trang được xem nhiều</h3>
              <p className={styles.sectionText}>
                Top URL công khai có nhiều lượt xem nhất trong kỳ.
              </p>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Đường dẫn</th>
                  <th>Lượt xem</th>
                  <th>Khách</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPaths.length ? (
                  analytics.topPaths.map((item) => (
                    <tr key={item.path}>
                      <td>
                        <Link href={item.path} className={styles.pathLink}>
                          {item.path}
                        </Link>
                      </td>
                      <td>{formatNumber(item.pageViews)}</td>
                      <td>{formatNumber(item.uniqueVisitors)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className={styles.emptyState}>
                      Chưa có lượt truy cập nào trong kỳ này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
