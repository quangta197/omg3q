import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { blogPosts } from "@/lib/blog-data";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "../route-layout.module.css";

export const metadata = createMetadata({
  title: "Blog OMG3Q: huong dan mua nick an toan va kinh nghiem chon acc",
  description:
    "Tong hop bai viet huong dan mua nick OMG3Q an toan, khung gia tham khao va kinh nghiem chon tai khoan phu hop.",
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
        eyebrow="Kinh nghiệm giao dịch"
        title="Blog OMG3Q tổng hợp hướng dẫn mua nick an toàn và dễ chọn hơn."
        description="Tại đây là các bài viết ngắn gọn về cách kiểm tra tài khoản, khung giá tham khảo và những lưu ý cần xem trước khi chốt."
        metrics={[
          { label: "Bài nổi bật", value: String(blogPosts.length) },
          { label: "Phù hợp", value: "Người mua mới" },
          { label: "Nội dung", value: "An toàn + giá tham khảo" },
        ]}
        sectionTitle="Nên đọc trước khi chốt nick"
        sectionText="Nếu mới mua lần đầu, hãy xem bài hướng dẫn an toàn trước. Khi cần ước lượng ngân sách, mở bài bảng giá để so sánh nhanh hơn."
        bullets={blogPosts.map((post) => post.title)}
        ctaHref="/accounts"
        ctaLabel="Xem nick đang bán"
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
