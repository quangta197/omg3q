import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/accounts",
          "/blog",
          "/bang-gia-nick-omg3q",
          "/huong-dan-mua-acc-omg3q",
          "/quy-trinh-giao-dich",
          "/chinh-sach-bao-hanh",
        ],
        disallow: ["/admin", "/api", "/*?*power_*", "/*?*price_*"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
