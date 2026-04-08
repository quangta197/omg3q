import Link from "next/link";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts } from "@/lib/accounts";
import { blogPosts } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const revalidate = 300;

export const metadata = createMetadata({
  title: "Blog OMG3Q | Kinh nghiệm mua acc, bảng giá và chọn acc",
  description:
    "Blog OMG3Q tổng hợp hướng dẫn mua acc an toàn, chọn acc cho tân thủ, kinh nghiệm chọn server và bảng giá tham khảo.",
  path: "/blog",
  keywords: [
    "blog omg3q",
    "kinh nghiệm mua acc omg3q",
    "shop acc omg3q",
    "bảng giá acc omg3q",
  ],
});

export default async function BlogPage() {
  const featuredAccounts = await getFeaturedAccounts(3);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Blog OMG3Q", path: "/blog" },
        ])}
      />
      <MarketingShell
        eyebrow="Kinh nghiệm giao dịch"
        title="Blog OMG3Q giúp bạn mua acc đúng nhu cầu và an toàn hơn"
        description="Tổng hợp các bài viết dễ đọc về cách mua acc, cách xem bảng giá, chọn server và những lưu ý quan trọng trước khi chốt acc."
        metrics={[
          { label: "Bài đang có", value: String(blogPosts.length) },
          { label: "Tập trung", value: "An toàn + giá + chọn acc" },
          { label: "Mục tiêu", value: "Đọc xong dễ chọn acc hơn" },
        ]}
        sectionTitle="Nên đọc gì trước khi chốt acc"
        sectionText="Nếu bạn mua lần đầu, hãy đọc bài về an toàn giao dịch trước. Nếu đang phân vân ngân sách, xem bảng giá. Nếu đang ngợp vì quá nhiều lựa chọn, bắt đầu từ bài chọn acc cho tân thủ."
        bullets={blogPosts.slice(0, 4).map((post) => post.title)}
        ctaHref="/accounts"
        ctaLabel="Mở danh sách acc OMG3Q"
      />

      <div className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Tất cả bài viết</span>
              <h2 className={styles.title}>Những nội dung nên đọc trước khi mua acc</h2>
            </div>
            <Link href="/bang-gia-nick-omg3q" className={styles.secondaryLink}>
              Xem bảng giá
            </Link>
          </div>

          <div className={styles.postGrid}>
            {blogPosts.map((post) => (
              <article key={post.slug} className={styles.postCard}>
                <div className={styles.postMeta}>
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postDescription}>{post.description}</p>
                <div className={styles.cardLinks}>
                  <Link href={`/blog/${post.slug}`} className={styles.primaryLink}>
                    Đọc bài viết
                  </Link>
                  <Link href={post.ctaHref} className={styles.ghostLink}>
                    {post.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {featuredAccounts.length ? (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.eyebrow}>Acc nổi bật</span>
                <h2 className={styles.title}>Một vài tài khoản đáng xem ngay lúc này</h2>
              </div>
              <Link href="/accounts" className={styles.primaryLink}>
                Xem toàn bộ acc
              </Link>
            </div>

            <AccountGrid items={featuredAccounts} />
          </section>
        ) : null}
      </div>
    </>
  );
}
