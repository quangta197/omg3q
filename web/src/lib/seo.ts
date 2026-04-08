import type { Metadata } from "next";

export const siteConfig = {
  name: "OMG3Q Shop",
  defaultTitle: "OMG3Q Shop | Mua bán nick OMG3Q uy tín, giá tốt",
  defaultDescription:
    "Shop mua bán nick OMG3Q ưu tiên SEO và chuyển đổi, tập trung server hot, phân khúc VIP và hướng dẫn giao dịch an toàn.",
  defaultKeywords: [
    "mua nick omg3q",
    "ban nick omg3q",
    "shop nick omg3q",
    "nick omg3q gia re",
    "nick omg3q uy tin",
  ],
};

function normalizeSiteUrl(value: string) {
  return value.startsWith("http") ? value : `https://${value}`;
}

function isDeprecatedPrimaryDomain(value: string) {
  return value.includes("omg3q.vn");
}

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitSiteUrl && !isDeprecatedPrimaryDomain(explicitSiteUrl)) {
    return normalizeSiteUrl(explicitSiteUrl);
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercelProductionUrl) {
    return normalizeSiteUrl(vercelProductionUrl);
  }

  return "https://shopomg3q.com";
}

export function absoluteUrl(path = "/") {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function createMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
      },
    },
  };
}

export function getGoogleVerification() {
  const verificationToken = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();

  if (
    !verificationToken ||
    verificationToken === "google-site-verification-code"
  ) {
    return undefined;
  }

  return verificationToken;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}
