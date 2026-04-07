import { ContactForm } from "@/components/contact/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "./page.module.css";

export const metadata = createMetadata({
  title: "Liên hệ OMG3Q Shop",
  description:
    "Trang liên hệ chính thức để gửi yêu cầu mua nick, giữ acc và nhận hướng dẫn giao dịch an toàn từ OMG3Q Shop.",
  path: "/lien-he",
  keywords: ["liên hệ omg3q shop", "giữ nick omg3q", "hỗ trợ mua nick omg3q"],
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Liên hệ", path: "/lien-he" },
        ])}
      />

      <main className={`container ${styles.page}`}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Kênh hỗ trợ chính</span>
          <h1 className={styles.title}>Liên hệ để giữ nick và chốt giao dịch</h1>
          <p className={styles.description}>
            Nếu bạn chưa chọn xong tài khoản cụ thể, hãy gửi form tại đây. Đội ngũ
            sẽ tư vấn theo server, phân khúc giá và nhu cầu phù hợp.
          </p>
          <div className={styles.meta}>
            <a href={`tel:${process.env.NEXT_PUBLIC_PHONE || "0123456789"}`}>
              Hotline: {process.env.NEXT_PUBLIC_PHONE || "0123456789"}
            </a>
            <a href={process.env.NEXT_PUBLIC_ZALO_LINK || "#"}>Zalo hỗ trợ</a>
            <a href={process.env.NEXT_PUBLIC_FB_PAGE || "#"}>Messenger</a>
          </div>
        </section>

        <div className={styles.grid}>
          <ContactForm
            title="Gửi nhu cầu mua nick"
            description="Điền thông tin liên hệ và mô tả nhu cầu. Form này dùng cho cả lead chưa chọn acc cụ thể."
          />

          <aside className={styles.sidebar}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Khi nào nên dùng form này?</h2>
              <ul className={styles.list}>
                <li>Bạn cần shop lọc acc theo server hoặc quốc gia.</li>
                <li>Bạn muốn so sánh nhiều phân khúc giá trước khi chốt.</li>
                <li>Bạn muốn giữ lead tập trung thay vì chat rời rạc nhiều kênh.</li>
              </ul>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin xử lý</h2>
              <ul className={styles.list}>
                <li>Ưu tiên phản hồi qua Zalo hoặc điện thoại.</li>
                <li>Lead từ form được lưu vào hệ thống để tránh sót đơn.</li>
                <li>Nếu cần gấp, hãy gọi hotline sau khi gửi form.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
