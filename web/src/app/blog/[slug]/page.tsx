import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedAccounts } from "@/lib/accounts";
import { blogPosts, getBlogPostBySlug } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const revalidate = 300;

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return createMetadata({
      title: "Bài viết không tồn tại",
      description: "Nội dung không hợp lệ hoặc đã được gỡ khỏi website.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `${post.title} | Blog OMG3Q`,
    description: post.description,
    path: `/blog/${slug}`,
    keywords: post.keywords,
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const featuredAccounts = await getFeaturedAccounts(3);
  const summaryBullets =
    post.sections.find((section) => section.bullets?.length)?.bullets ??
    post.sections.map((section) => section.heading).slice(0, 3);
  const jsonLdData = [
    buildBreadcrumbSchema([
      { name: "Trang chủ", path: "/" },
      { name: "Blog OMG3Q", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    buildFaqSchema(post.faq),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  return (
    <>
      <JsonLd data={jsonLdData} />

      <MarketingShell
        eyebrow={post.category}
        title={post.title}
        description={post.description}
        metrics={post.metrics}
        sectionTitle="Tóm tắt nhanh trước khi đọc sâu"
        sectionText={post.intro}
        bullets={summaryBullets}
        ctaHref={post.ctaHref}
        ctaLabel={post.ctaLabel}
      />

      <main className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Nội dung chính</span>
              <h2 className={styles.title}>
                Đi thẳng vào các điểm ảnh hưởng tới quyết định mua acc
              </h2>
            </div>
            <span className={styles.readingTime}>{post.readTime}</span>
          </div>

          <div className={styles.articleBody}>
            {post.sections.map((section) => (
              <article key={section.heading} className={styles.articleSection}>
                <h3 className={styles.sectionTitle}>{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className={styles.bulletList}>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>Xem thêm</span>
              <h2 className={styles.title}>
                Mở tiếp các trang liên quan để so sánh và chốt acc dễ hơn
              </h2>
            </div>
          </div>

          <div className={styles.linkGrid}>
            {post.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.linkCard}>
                <strong>{link.label}</strong>
                <p>{link.description}</p>
              </Link>
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
                Xem toàn bộ acc OMG3Q
              </Link>
            </div>

            <AccountGrid items={featuredAccounts} />
          </section>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>FAQ</span>
              <h2 className={styles.title}>Câu hỏi thường gặp quanh chủ đề này</h2>
            </div>
          </div>

          <div className={styles.faqGrid}>
            {post.faq.map((item) => (
              <article key={item.question} className={styles.faqCard}>
                <h3 className={styles.question}>{item.question}</h3>
                <p className={styles.answer}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
