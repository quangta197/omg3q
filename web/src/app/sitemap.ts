import type { MetadataRoute } from "next";
import {
  getAccountSlugs,
  getNationCodes,
  getServerCodes,
  getVipLevels,
} from "@/lib/accounts";
import { blogPosts } from "@/lib/blog-data";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/accounts",
    "/accounts/vip",
    "/bang-gia-nick-omg3q",
    "/blog",
    "/lien-he",
    "/huong-dan-mua-acc-omg3q",
    "/quy-trinh-giao-dich",
    "/chinh-sach-bao-hanh",
  ];
  const [servers, nations, vipLevels, accountSlugs] = await Promise.all([
    getServerCodes(),
    getNationCodes(),
    getVipLevels(),
    getAccountSlugs(),
  ]);

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.8,
    })),
    ...servers.map((server) => ({
      url: absoluteUrl(`/accounts/server/${server}`),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...nations.map((nation) => ({
      url: absoluteUrl(`/accounts/nation/${nation}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.76,
    })),
    ...vipLevels.map((level) => ({
      url: absoluteUrl(`/accounts/vip/${level}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.78,
    })),
    ...accountSlugs.map((slug) => ({
      url: absoluteUrl(`/accounts/${slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.64,
    })),
  ];
}
