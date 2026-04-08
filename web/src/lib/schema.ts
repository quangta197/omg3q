import { absoluteUrl, siteConfig } from "@/lib/seo";
import type { AccountDetail, AccountSummary } from "@/lib/types";

type JsonLdRecord = Record<string, unknown>;

export function buildOrganizationSchema(): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/og-image.png"),
    sameAs: [
      process.env.NEXT_PUBLIC_ZALO_LINK,
      process.env.NEXT_PUBLIC_FB_PAGE,
    ].filter(Boolean),
  };
}

export function buildWebsiteSchema(): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/accounts")}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildItemListSchema(
  path: string,
  items: AccountSummary[]
): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    url: absoluteUrl(path),
    numberOfItems: items.length,
    itemListElement: items.map((account, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/accounts/${account.slug}`),
      name: account.title,
    })),
  };
}

export function buildProductSchema(account: AccountDetail): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: account.title,
    description: account.description,
    url: absoluteUrl(`/accounts/${account.slug}`),
    category: "Game Account",
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: account.price,
      availability:
        account.status === "sold"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url: absoluteUrl(`/accounts/${account.slug}`),
    },
  };
}

export function buildFaqSchema(
  items: Array<{ question: string; answer: string }>
): JsonLdRecord | null {
  if (!items.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
