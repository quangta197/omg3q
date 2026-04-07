export type NationCode = "nguy" | "thuc" | "ngo";

export type AccountSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  server: string;
  nation: NationCode | string;
  vipLevel: number;
  powerScore: number;
  price: number;
  installmentPrice: number | null;
  originalPrice: number | null;
  imageCount: number;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  highlights: string[];
};

export type AccountDetail = AccountSummary & {
  level: number;
  status: "available" | "reserved" | "sold" | "hidden";
  thumbnailUrl: string | null;
  highlights: string[];
  images: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
  }>;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

export type ServerOption = {
  id: string;
  code: string;
  name: string;
};

export type NationOption = {
  id: string;
  code: string;
  name: string;
};

export type AccountSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "power_desc";

export type AccountListFilters = {
  search?: string;
  server?: string;
  nation?: string;
  priceMin?: number;
  priceMax?: number;
  powerMin?: number;
  powerMax?: number;
  sort?: AccountSort;
  page?: number;
  limit?: number;
};

export type AccountListResult = {
  items: AccountSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  appliedFilters: AccountListFilters;
};

export type AccountRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  vip_level: number | null;
  power_score: number | null;
  price: number | string;
  installment_price?: number | string | null;
  original_price?: number | string | null;
  is_featured: boolean | null;
  level: number | null;
  status: "available" | "reserved" | "sold" | "hidden";
  thumbnail_url: string | null;
  highlights: string[] | null;
  account_images?:
    | Array<{
        id: string;
        image_url: string;
        caption?: string | null;
        sort_order?: number | null;
      }>
    | null;
  servers:
    | {
        code: string;
        name?: string | null;
      }
    | Array<{
        code: string;
        name?: string | null;
      }>
    | null;
  nations:
    | {
        code: string;
        name?: string | null;
      }
    | Array<{
        code: string;
        name?: string | null;
      }>
    | null;
};

export type ContactMethod = "zalo" | "facebook" | "phone" | "form";

export type ContactRequestPayload = {
  account_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_zalo?: string;
  contact_method?: ContactMethod;
  message?: string;
};
