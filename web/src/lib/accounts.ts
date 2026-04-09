import { cache } from "react";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type {
  AccountDetail,
  AccountListFilters,
  AccountListResult,
  AccountRow,
  AccountSort,
  AccountSummary,
  NationCode,
  NationOption,
  ServerOption,
} from "@/lib/types";

const ACCOUNT_SELECT_BASE = `
  id,
  slug,
  title,
  description,
  vip_level,
  power_score,
  price,
  original_price,
  is_featured,
  level,
  status,
  thumbnail_url,
  highlights,
  account_images(id,image_url,caption,sort_order),
  servers:server_id(code,name),
  nations:nation_id(code,name)
`;

const ACCOUNT_SELECT = `
  ${ACCOUNT_SELECT_BASE.trim().replace("price,\n  original_price,", "price,\n  installment_price,\n  original_price,")}
`;

function isMissingInstallmentColumnError(message: string) {
  return (
    message.includes("installment_price") &&
    message.includes("does not exist")
  );
}

function getRelationCode(
  relation:
    | AccountRow["servers"]
    | AccountRow["nations"]
) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.code ?? null;
  }

  return relation.code;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function mapAccountSummary(row: AccountRow): AccountSummary {
  const imageCount = Math.max(
    row.account_images?.length ?? 0,
    row.thumbnail_url ? 1 : 0
  );

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    server: getRelationCode(row.servers) ?? "unknown",
    nation: (getRelationCode(row.nations) ?? "unknown") as NationCode | string,
    vipLevel: row.vip_level ?? 0,
    powerScore: row.power_score ?? 0,
    price: toNumber(row.price),
    installmentPrice:
      row.installment_price == null ? null : toNumber(row.installment_price),
    originalPrice: row.original_price == null ? null : toNumber(row.original_price),
    imageCount,
    thumbnailUrl: row.thumbnail_url,
    isFeatured: Boolean(row.is_featured),
    highlights: row.highlights ?? [],
  };
}

function mapAccountDetail(row: AccountRow): AccountDetail {
  return {
    ...mapAccountSummary(row),
    level: row.level ?? 1,
    status: row.status,
    highlights: row.highlights ?? [],
    images: (row.account_images ?? [])
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      .map((image) => ({
        id: image.id,
        imageUrl: image.image_url,
        caption: image.caption ?? null,
        sortOrder: image.sort_order ?? 0,
      })),
  };
}

function normalizePagination({
  page = 1,
  limit = 16,
}: Pick<AccountListFilters, "page" | "limit">) {
  const safeLimit = Math.max(1, Math.min(limit, 24));
  const safePage = Math.max(1, page);

  return {
    page: safePage,
    limit: safeLimit,
    from: (safePage - 1) * safeLimit,
    to: safePage * safeLimit - 1,
  };
}

function normalizeSort(sort?: AccountSort) {
  return sort ?? "newest";
}

async function getActiveRelationIds(column: "server_id" | "nation_id") {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select(column)
    .in("status", ["available", "reserved"]);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(
    new Set(
      ((data ?? []) as Array<Record<typeof column, string | null>>)
        .map((item) => item[column])
        .filter((value): value is string => Boolean(value))
    )
  );
}

export const getAccounts = cache(async (): Promise<AccountSummary[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const buildQuery = (selectClause: string) =>
    supabase
      .from("accounts")
      .select(selectClause)
      .in("status", ["available", "reserved"])
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

  let { data, error } = await buildQuery(ACCOUNT_SELECT);

  if (error && isMissingInstallmentColumnError(error.message)) {
    ({ data, error } = await buildQuery(ACCOUNT_SELECT_BASE));
  }

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as AccountRow[]).map(mapAccountSummary);
});

async function resolveServerId(serverCode: string) {
  const servers = await getServers();
  return servers.find((item) => item.code === serverCode)?.id ?? null;
}

async function resolveNationId(nationCode: string) {
  const nations = await getNations();
  return nations.find((item) => item.code === nationCode)?.id ?? null;
}

export async function getAccountsWithFilters(
  filters: AccountListFilters
): Promise<AccountListResult> {
  const { page, limit, from, to } = normalizePagination(filters);
  const appliedSort = normalizeSort(filters.sort);

  const emptyResult = {
    items: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
    appliedFilters: { ...filters, page, limit, sort: appliedSort },
  };

  if (!isSupabaseConfigured()) {
    return emptyResult;
  }

  const supabase = getSupabaseServerClient();
  const serverId = filters.server ? await resolveServerId(filters.server) : null;
  const nationId = filters.nation ? await resolveNationId(filters.nation) : null;

  if ((filters.server && !serverId) || (filters.nation && !nationId)) {
    return emptyResult;
  }

  const escapedSearch = filters.search?.replace(/[%:,]/g, " ").trim();

  if (filters.search && !escapedSearch) {
    return emptyResult;
  }

  function buildQuery(selectClause: string) {
    let query = supabase
      .from("accounts")
      .select(selectClause, { count: "exact" })
      .in("status", ["available", "reserved"]);

    if (serverId) {
      query = query.eq("server_id", serverId);
    }

    if (nationId) {
      query = query.eq("nation_id", nationId);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte("price", filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.lte("price", filters.priceMax);
    }

    if (filters.powerMin !== undefined) {
      query = query.gte("power_score", filters.powerMin);
    }

    if (filters.powerMax !== undefined) {
      query = query.lte("power_score", filters.powerMax);
    }

    if (escapedSearch) {
      query = query.or(
        `title.ilike.*${escapedSearch}*,description.ilike.*${escapedSearch}*`
      );
    }

    if (appliedSort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (appliedSort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("is_featured", { ascending: false }).order("created_at", {
        ascending: false,
      });
    }

    return query.range(from, to);
  }

  let { data, count, error } = await buildQuery(ACCOUNT_SELECT);

  if (error && isMissingInstallmentColumnError(error.message)) {
    ({ data, count, error } = await buildQuery(ACCOUNT_SELECT_BASE));
  }

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: ((data ?? []) as unknown as AccountRow[]).map(mapAccountSummary),
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    appliedFilters: {
      ...filters,
      page,
      limit,
      sort: appliedSort,
    },
  };
}

export const getFeaturedAccounts = cache(
  async (limit = 6): Promise<AccountSummary[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabaseServerClient();
    const buildQuery = (selectClause: string) =>
      supabase
        .from("accounts")
        .select(selectClause)
        .eq("is_featured", true)
        .in("status", ["available", "reserved"])
        .order("created_at", { ascending: false })
        .limit(limit);

    let { data, error } = await buildQuery(ACCOUNT_SELECT);

    if (error && isMissingInstallmentColumnError(error.message)) {
      ({ data, error } = await buildQuery(ACCOUNT_SELECT_BASE));
    }

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as unknown as AccountRow[]).map(mapAccountSummary);
  }
);

export const getAccountBySlug = cache(
  async (slug: string): Promise<AccountDetail | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = getSupabaseServerClient();
    const buildQuery = (selectClause: string) =>
      supabase
        .from("accounts")
        .select(selectClause)
        .eq("slug", slug)
        .in("status", ["available", "reserved", "sold"])
        .maybeSingle();

    let { data, error } = await buildQuery(ACCOUNT_SELECT);

    if (error && isMissingInstallmentColumnError(error.message)) {
      ({ data, error } = await buildQuery(ACCOUNT_SELECT_BASE));
    }

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return mapAccountDetail(data as unknown as AccountRow);
  }
);

export const getAccountsByServer = cache(
  async (serverCode: string): Promise<AccountSummary[]> => {
    const { items } = await getAccountsWithFilters({
      server: serverCode,
      limit: 16,
      sort: "newest",
    });
    return items;
  }
);

export const getAccountsByNation = cache(
  async (nationCode: string): Promise<AccountSummary[]> => {
    const { items } = await getAccountsWithFilters({
      nation: nationCode,
      limit: 16,
      sort: "newest",
    });
    return items;
  }
);

export const getServers = cache(async (): Promise<ServerOption[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("servers")
    .select("id, code, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ServerOption[];
});

export const getNations = cache(async (): Promise<NationOption[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("nations")
    .select("id, code, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NationOption[];
});

export const getServerCodes = cache(async (): Promise<string[]> => {
  const [servers, activeServerIds] = await Promise.all([
    getServers(),
    getActiveRelationIds("server_id"),
  ]);
  const activeServerIdSet = new Set(activeServerIds);

  return servers
    .filter((item) => activeServerIdSet.has(item.id))
    .map((item) => item.code);
});

export const getNationCodes = cache(async (): Promise<string[]> => {
  const [nations, activeNationIds] = await Promise.all([
    getNations(),
    getActiveRelationIds("nation_id"),
  ]);
  const activeNationIdSet = new Set(activeNationIds);

  return nations
    .filter((item) => activeNationIdSet.has(item.id))
    .map((item) => item.code);
});

export const getAccountSlugs = cache(async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("slug")
    .in("status", ["available", "reserved", "sold"]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => item.slug as string);
});

export const getFilterStats = cache(
  async (): Promise<{
    priceMin: number;
    priceMax: number;
    powerMin: number;
    powerMax: number;
    totalAvailable: number;
  }> => {
    if (!isSupabaseConfigured()) {
      return {
        priceMin: 0,
        priceMax: 0,
        powerMin: 0,
        powerMax: 0,
        totalAvailable: 0,
      };
    }

    const supabase = getSupabaseServerClient();

    const [
      { data: minPriceData, error: minPriceError },
      { data: maxPriceData, error: maxPriceError },
      { data: minPowerData, error: minPowerError },
      { data: maxPowerData, error: maxPowerError },
      { count, error: countError },
    ] = await Promise.all([
      supabase
        .from("accounts")
        .select("price")
        .in("status", ["available", "reserved"])
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("price")
        .in("status", ["available", "reserved"])
        .order("price", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("power_score")
        .in("status", ["available", "reserved"])
        .order("power_score", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("power_score")
        .in("status", ["available", "reserved"])
        .order("power_score", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id", { count: "exact", head: true })
        .in("status", ["available", "reserved"]),
    ]);

    const firstError =
      minPriceError ||
      maxPriceError ||
      minPowerError ||
      maxPowerError ||
      countError;

    if (firstError) {
      throw new Error(firstError.message);
    }

    return {
      priceMin: toNumber(minPriceData?.price ?? 0),
      priceMax: toNumber(maxPriceData?.price ?? 0),
      powerMin: toNumber(minPowerData?.power_score ?? 0),
      powerMax: toNumber(maxPowerData?.power_score ?? 0),
      totalAvailable: count ?? 0,
    };
  }
);
