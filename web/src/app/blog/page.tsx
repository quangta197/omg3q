import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPosts } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "../route-layout.module.css";

export const metadata = createMetadata({
  title: "Blog OMG3Q cho SEO giao dich va topical authority",
  description:
    "Hub bai viet phuc vu organic growth: huong dan an toan, bang gia, so sanh VIP va noi dung noi bo tro giao dich.",
  path: "/blog",
  keywords: ["blog omg3q", "huong dan mua nick omg3q", "kinh nghiem mua nick game"],
});

export default function BlogPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chu", path: "/" },
          { name: "Blog OMG3Q", path: "/blog" },
        ])}
      />
      <MarketingShell
        eyebrow="Content hub"
        title="Blog la bo may topical authority, khong phai muc tin tuc cho co."
        description="Cum bai viet nay duoc tao de support organic ranking cho landing pages giao dich, khong viet lan man. Moi bai phai co internal link ve cluster phu hop."
        metrics={[
          { label: "Tan suat", value: "3 bai / tuan" },
          { label: "Loai bai", value: "Trust + pricing + strategy" },
          { label: "Muc tieu", value: "Organic to lead" },
        ]}
        sectionTitle="Bai viet tru cot can len truoc"
        sectionText="Sprint dau nen co bai huong dan giao dich an toan, bai bang gia va bai so sanh theo VIP/server. Day la 3 nhom content gay lead ro nhat."
        bullets={blogPosts.map((post) => post.title)}
        ctaHref="/blog/cach-mua-nick-omg3q-an-toan"
        ctaLabel="Mo bai tru cot dau tien"
      />
      <div className={styles.stack}>
        <ul className={styles.blogList}>
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={styles.blogLink}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
