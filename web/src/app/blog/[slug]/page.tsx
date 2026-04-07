import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPosts, getBlogPostBySlug } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";

const blogShellContent = {
  "cach-mua-nick-omg3q-an-toan": {
    metrics: [
      { label: "Phù hợp", value: "Người mua lần đầu" },
      { label: "Mục tiêu", value: "Tránh mất acc" },
      { label: "Hành động", value: "Kiểm tra đủ trước khi chốt" },
    ],
    sectionTitle: "Checklist cần xem trước khi giao dịch",
    sectionText:
      "Trước khi thanh toán, hãy kiểm tra ảnh, thông tin liên kết, server, quốc gia và chính sách hỗ trợ để tránh mua nhầm hoặc nhận acc không đúng mô tả.",
    bullets: [
      "Yêu cầu xem đủ ảnh tài khoản, đội hình và vật phẩm quan trọng.",
      "Kiểm tra rõ server, quốc gia, VIP và các thông tin liên kết.",
      "Chỉ chốt khi đã thống nhất cách bàn giao và hỗ trợ sau giao dịch.",
    ],
    ctaHref: "/accounts",
    ctaLabel: "Xem nick đang bán",
  },
  "bang-gia-nick-omg3q-theo-vip": {
    metrics: [
      { label: "Phù hợp", value: "Người cần chốt ngân sách" },
      { label: "Tập trung", value: "VIP + đội hình" },
      { label: "Gợi ý", value: "So sánh trước khi mua" },
    ],
    sectionTitle: "Cách nhìn khung giá cho đúng",
    sectionText:
      "Giá nick thường thay đổi theo VIP, độ hiếm đội hình và tình trạng server. Hãy dùng bảng giá như mốc tham khảo trước khi xem từng nick cụ thể.",
    bullets: [
      "VIP càng cao thì giá thường tăng rõ.",
      "Đội hình hiếm, tướng đẹp và tài nguyên dày sẽ kéo giá lên thêm.",
      "Nên so sánh nhiều nick cùng tầm tiền trước khi quyết định.",
    ],
    ctaHref: "/bang-gia-nick-omg3q",
    ctaLabel: "Xem bảng giá tham khảo",
  },
} as const;

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

  const shellContent =
    blogShellContent[post.slug as keyof typeof blogShellContent] ??
    blogShellContent["cach-mua-nick-omg3q-an-toan"];

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
        metrics={shellContent.metrics}
        sectionTitle={shellContent.sectionTitle}
        sectionText={shellContent.sectionText}
        bullets={shellContent.bullets}
        ctaHref={shellContent.ctaHref}
        ctaLabel={shellContent.ctaLabel}
      />
    </>
  );
}
