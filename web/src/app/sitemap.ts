import type { MetadataRoute } from "next";
import { getAccountSlugs, getNationCodes, getServerCodes } from "@/lib/accounts";
import { blogPosts } from "@/lib/blog-data";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["/", "/accounts", "/bang-gia-nick-omg3q", "/blog", "/lien-he"];
  const [servers, nations, accountSlugs] = await Promise.all([
    getServerCodes(),
    getNationCodes(),
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
