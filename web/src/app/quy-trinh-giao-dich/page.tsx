import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";
import styles from "../trust-page.module.css";

export const metadata = createMetadata({
  title: "Quy trình giao dịch acc OMG3Q | Giữ acc, chốt giá và bàn giao",
  description:
    "Quy trình giao dịch acc OMG3Q tại shop: chọn nick, gửi thông tin liên hệ, giữ acc, xác nhận giá, bàn giao và hỗ trợ sau giao dịch.",
  path: "/quy-trinh-giao-dich",
  keywords: [
    "quy trình mua acc omg3q",
    "giao dịch acc omg3q",
    "bàn giao nick omg3q",
    "giữ acc omg3q",
  ],
});

export default function TradingProcessPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Quy trình giao dịch", path: "/quy-trinh-giao-dich" },
        ])}
      />

      <MarketingShell
        eyebrow="Quy trình giao dịch"
        title="Quy trình mua acc OMG3Q rõ từng bước, dễ đối chiếu sau bàn giao"
        description="Shop ưu tiên giao dịch có ghi nhận rõ nhu cầu, thông tin acc, giá chốt và các bước hỗ trợ sau khi khách nhận nick."
        metrics={[
          { label: "Bước chính", value: "5 bước" },
          { label: "Kênh hỗ trợ", value: "Zalo + Messenger + Hotline" },
          { label: "Mục tiêu", value: "Chốt rõ, bàn giao gọn" },
        ]}
        sectionTitle="Vì sao cần quy trình rõ"
        sectionText="Khi mua acc game, điều quan trọng là mọi thông tin đã chốt phải có thể đối chiếu lại. Quy trình rõ giúp khách yên tâm và giúp shop xử lý nhanh khi cần hỗ trợ."
        bullets={[
          "Khách chọn acc hoặc gửi nhu cầu tìm acc.",
          "Shop xác nhận tình trạng, giá và cách bàn giao.",
          "Sau khi hoàn tất, khách kiểm tra lại theo mô tả đã chốt.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Chọn acc để giao dịch"
      />

      <main className={styles.stack}>
        <section className={styles.panel}>
          <div>
            <span className={styles.eyebrow}>Các bước thực tế</span>
            <h2 className={styles.title}>Từ lúc chọn acc đến lúc nhận nick</h2>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <strong>1. Chọn acc hoặc gửi nhu cầu</strong>
              <p>Mở danh sách acc, lọc theo server, quốc gia, VIP, giá hoặc gửi form nếu muốn shop lọc giúp.</p>
            </article>
            <article className={styles.card}>
              <strong>2. Shop kiểm tra tình trạng</strong>
              <p>Shop xác nhận acc còn bán, đang giữ hay đã bán để tránh khách mất thời gian chờ.</p>
            </article>
            <article className={styles.card}>
              <strong>3. Chốt thông tin giao dịch</strong>
              <p>Hai bên thống nhất acc cần mua, giá, thời gian giữ acc và kênh hỗ trợ sau bàn giao.</p>
            </article>
            <article className={styles.card}>
              <strong>4. Bàn giao theo hướng dẫn</strong>
              <p>Shop hướng dẫn các bước nhận nick và những việc cần làm ngay để giữ quyền kiểm soát.</p>
            </article>
            <article className={styles.card}>
              <strong>5. Đối chiếu sau khi nhận</strong>
              <p>Khách kiểm tra lại ảnh, mô tả, VIP, server và báo sớm nếu có điểm chưa đúng.</p>
            </article>
            <article className={styles.card}>
              <strong>6. Hỗ trợ sau giao dịch</strong>
              <p>Shop tiếp tục hỗ trợ các câu hỏi trong phạm vi thông tin đã chốt và chính sách công khai.</p>
            </article>
          </div>
        </section>

        <section className={styles.panel}>
          <div>
            <span className={styles.eyebrow}>Đi tiếp</span>
            <h2 className={styles.title}>Các trang nên đọc trước khi chốt</h2>
          </div>
          <div className={styles.actions}>
            <Link href="/huong-dan-mua-acc-omg3q" className={styles.primaryLink}>
              Hướng dẫn mua an toàn
            </Link>
            <Link href="/chinh-sach-bao-hanh" className={styles.secondaryLink}>
              Chính sách bảo hành
            </Link>
            <Link href="/lien-he" className={styles.secondaryLink}>
              Liên hệ shop
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
