import { getSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase-admin";

const MAX_PATH_LENGTH = 1000;
const MAX_REFERRER_LENGTH = 1000;
const MAX_USER_AGENT_LENGTH = 1000;
const MAX_VISITOR_ID_LENGTH = 120;
const MAX_ANALYTICS_ROWS = 100000;
const DAY_MS = 24 * 60 * 60 * 1000;
const VIETNAM_UTC_OFFSET = "+07:00";

export type DailyVisitStat = {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
};

export type PathVisitStat = {
  path: string;
  pageViews: number;
  uniqueVisitors: number;
};

export type VisitAnalytics = {
  days: number;
  totalPageViews: number;
  selectedPageViews: number;
  selectedUniqueVisitors: number;
  todayPageViews: number;
  todayUniqueVisitors: number;
  last7DaysPageViews: number;
  last30DaysPageViews: number;
  dailyStats: DailyVisitStat[];
  topPaths: PathVisitStat[];
  isLimited: boolean;
};

type SiteVisitRow = {
  created_at: string;
  path: string | null;
  visitor_id: string | null;
};

function trimToLength(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizePath(path: string | null | undefined) {
  const normalizedPath = trimToLength(path, MAX_PATH_LENGTH);

  if (!normalizedPath || !normalizedPath.startsWith("/")) {
    return null;
  }

  if (normalizedPath.startsWith("/admin") || normalizedPath.startsWith("/api")) {
    return null;
  }

  return normalizedPath;
}

function normalizeVisitorId(visitorId: string | null | undefined) {
  const normalizedVisitorId = trimToLength(visitorId, MAX_VISITOR_ID_LENGTH);

  if (!normalizedVisitorId) {
    return null;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(normalizedVisitorId)) {
    return null;
  }

  return normalizedVisitorId;
}

function getVietnamDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateKeys(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const offset = days - index - 1;
    return getVietnamDateKey(new Date(Date.now() - offset * DAY_MS));
  });
}

function getVietnamDayStartUtc(dateKey: string) {
  return new Date(`${dateKey}T00:00:00${VIETNAM_UTC_OFFSET}`);
}

function normalizeAnalyticsDays(days: number) {
  if (!Number.isFinite(days)) {
    return 30;
  }

  return Math.max(1, Math.min(Math.floor(days), 365));
}

function countUniqueVisitors(rows: SiteVisitRow[]) {
  return new Set(
    rows
      .map((row) => row.visitor_id)
      .filter((visitorId): visitorId is string => Boolean(visitorId))
  ).size;
}

export async function recordSiteVisit({
  path,
  referrer,
  visitorId,
  userAgent,
}: {
  path: string | null | undefined;
  referrer?: string | null;
  visitorId?: string | null;
  userAgent?: string | null;
}) {
  const normalizedPath = normalizePath(path);

  if (!normalizedPath || !hasSupabaseServiceRole()) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("site_visits").insert({
    path: normalizedPath,
    referrer: trimToLength(referrer, MAX_REFERRER_LENGTH),
    visitor_id: normalizeVisitorId(visitorId),
    user_agent: trimToLength(userAgent, MAX_USER_AGENT_LENGTH),
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getVisitAnalytics(daysInput = 30): Promise<VisitAnalytics> {
  const days = normalizeAnalyticsDays(daysInput);
  const dateKeys = getDateKeys(days);
  const todayKey = getVietnamDateKey(new Date());
  const todayStart = getVietnamDayStartUtc(todayKey);
  const selectedStart = getVietnamDayStartUtc(dateKeys[0] ?? todayKey);
  const last7DaysStart = getVietnamDayStartUtc(getDateKeys(7)[0] ?? todayKey);
  const last30DaysStart = getVietnamDayStartUtc(getDateKeys(30)[0] ?? todayKey);

  const emptyAnalytics: VisitAnalytics = {
    days,
    totalPageViews: 0,
    selectedPageViews: 0,
    selectedUniqueVisitors: 0,
    todayPageViews: 0,
    todayUniqueVisitors: 0,
    last7DaysPageViews: 0,
    last30DaysPageViews: 0,
    dailyStats: dateKeys.map((date) => ({
      date,
      pageViews: 0,
      uniqueVisitors: 0,
    })),
    topPaths: [],
    isLimited: false,
  };

  if (!hasSupabaseServiceRole()) {
    return emptyAnalytics;
  }

  const supabase = getSupabaseAdminClient();
  const [
    totalResult,
    selectedResult,
    todayResult,
    last7DaysResult,
    last30DaysResult,
    rowsResult,
  ] = await Promise.all([
    supabase.from("site_visits").select("id", { count: "exact", head: true }),
    supabase
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", selectedStart.toISOString()),
    supabase
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last7DaysStart.toISOString()),
    supabase
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last30DaysStart.toISOString()),
    supabase
      .from("site_visits")
      .select("created_at,path,visitor_id")
      .gte("created_at", selectedStart.toISOString())
      .order("created_at", { ascending: true })
      .range(0, MAX_ANALYTICS_ROWS - 1),
  ]);

  const firstError =
    totalResult.error ||
    selectedResult.error ||
    todayResult.error ||
    last7DaysResult.error ||
    last30DaysResult.error ||
    rowsResult.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  const rows = ((rowsResult.data ?? []) as SiteVisitRow[]).filter((row) =>
    Boolean(row.created_at)
  );
  const dailyMap = new Map<
    string,
    {
      pageViews: number;
      visitorIds: Set<string>;
    }
  >(
    dateKeys.map((date) => [
      date,
      {
        pageViews: 0,
        visitorIds: new Set<string>(),
      },
    ])
  );
  const pathMap = new Map<
    string,
    {
      pageViews: number;
      visitorIds: Set<string>;
    }
  >();

  rows.forEach((row) => {
    const dateKey = getVietnamDateKey(new Date(row.created_at));
    const dailyStat = dailyMap.get(dateKey);

    if (dailyStat) {
      dailyStat.pageViews += 1;

      if (row.visitor_id) {
        dailyStat.visitorIds.add(row.visitor_id);
      }
    }

    const path = row.path || "/";
    const pathStat =
      pathMap.get(path) ??
      {
        pageViews: 0,
        visitorIds: new Set<string>(),
      };

    pathStat.pageViews += 1;

    if (row.visitor_id) {
      pathStat.visitorIds.add(row.visitor_id);
    }

    pathMap.set(path, pathStat);
  });

  const todayRows = rows.filter(
    (row) => getVietnamDateKey(new Date(row.created_at)) === todayKey
  );

  return {
    days,
    totalPageViews: totalResult.count ?? 0,
    selectedPageViews: selectedResult.count ?? 0,
    selectedUniqueVisitors: countUniqueVisitors(rows),
    todayPageViews: todayResult.count ?? 0,
    todayUniqueVisitors: countUniqueVisitors(todayRows),
    last7DaysPageViews: last7DaysResult.count ?? 0,
    last30DaysPageViews: last30DaysResult.count ?? 0,
    dailyStats: Array.from(dailyMap.entries()).map(([date, value]) => ({
      date,
      pageViews: value.pageViews,
      uniqueVisitors: value.visitorIds.size,
    })),
    topPaths: Array.from(pathMap.entries())
      .map(([path, value]) => ({
        path,
        pageViews: value.pageViews,
        uniqueVisitors: value.visitorIds.size,
      }))
      .sort((left, right) => right.pageViews - left.pageViews)
      .slice(0, 12),
    isLimited: rows.length >= MAX_ANALYTICS_ROWS,
  };
}
