import type { Metadata } from "next";

export const siteConfig = {
  name: "OMG3Q Shop",
  defaultTitle: "OMG3Q Shop | Mua ban nick OMG3Q uy tin, gia tot",
  defaultDescription:
    "Shop mua ban nick OMG3Q uu tien SEO va chuyen doi, tap trung server hot, phan khuc VIP va huong dan giao dich an toan.",
  defaultKeywords: [
    "mua nick omg3q",
    "ban nick omg3q",
    "shop nick omg3q",
    "nick omg3q gia re",
    "nick omg3q uy tin",
  ],
};

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://omg3q.vn";
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

export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}
