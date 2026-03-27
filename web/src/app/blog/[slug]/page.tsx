import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPosts, getBlogPostBySlug } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";

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
      title: "Bai viet khong ton tai",
      description: "Noi dung khong hop le.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    keywords: ["blog omg3q", post.category.toLowerCase(), post.slug.replaceAll("-", " ")],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chu", path: "/" },
          { name: "Blog OMG3Q", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <MarketingShell
        eyebrow={post.category}
        title={post.title}
        description={post.description}
        metrics={[
          { label: "Muc dich", value: "Topical authority" },
          { label: "Anchor chinh", value: "Mua nick OMG3Q" },
          { label: "Trang thai", value: "Index" },
        ]}
        sectionTitle="Cach viet bai de thuc su co gia tri SEO"
        sectionText="Moi bai can tra loi mot truy van cu the, bo sung du lieu that va dan sang landing page giao dich tuong ung. Khong nen viet chung chung chi de day so luong bai."
        bullets={[
          "Co mo dau danh trung search intent.",
          "Co block checklist, FAQ hoac bang gia tri de tang kha nang rank.",
          "Co CTA noi bo sang listing va account detail lien quan.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Chuyen sang trang giao dich"
      />
    </>
  );
}
