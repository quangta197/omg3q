import type { Metadata } from "next";

export const siteConfig = {
  name: "OMG3Q Shop - Giao Dịch Uy Tín",
  defaultTitle: "OMG3Q Shop | Mua Bán Nick OMG3Q An Toàn & Bảo Mật",
  defaultDescription:
    "Shop chuyên doanh acc OMG3Q với quy trình kiểm soát nick kỹ càng. Hình ảnh thực tế, mô tả chi tiết từng acc, hỗ trợ giao dịch trực tiếp và bảo hành cho người mua.",
  defaultKeywords: [
    "mua acc omg3q",
    "shop acc omg3q",
    "acc omg3q giá rẻ",
    "acc omg3q uy tín",
    "mua nick omg3q",
    "bán nick omg3q",
    "địa chỉ mua acc omg3q tin cậy"
  ],
};

export const DEFAULT_SOCIAL_IMAGE_PATH = "/banner_ipad.png";
export const ORGANIZATION_LOGO_PATH = "/logo-mark.svg";

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

export function toAbsoluteMediaUrl(path: string) {
  return path.startsWith("http") ? path : absoluteUrl(path);
}

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  image?: string;
  imageAlt?: string;
};

export function createMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
  image = DEFAULT_SOCIAL_IMAGE_PATH,
  imageAlt,
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialImage = toAbsoluteMediaUrl(image);
  const socialImageAlt = imageAlt ?? title;

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
      images: [
        {
          url: socialImage,
          alt: socialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    robots: {
      index: !noIndex,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      googleBot: {
        index: !noIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
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
