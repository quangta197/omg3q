import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import styles from "../trust-page.module.css";

export const metadata = createMetadata({
  title: "Hướng dẫn mua acc OMG3Q an toàn | Checklist trước khi chốt nick",
  description:
    "Hướng dẫn mua acc OMG3Q an toàn: cách kiểm tra ảnh thật, server, VIP, giá, quy trình bàn giao và các bước cần làm trước khi chuyển khoản.",
  path: "/huong-dan-mua-acc-omg3q",
  keywords: [
    "hướng dẫn mua acc omg3q",
    "mua acc omg3q an toàn",
    "cách mua nick omg3q",
    "shop acc omg3q uy tín",
  ],
});

const faqs = [
  {
    question: "Mua acc OMG3Q cần kiểm tra gì trước tiên?",
    answer:
      "Nên kiểm tra ảnh thật, server, quốc gia, cấp VIP, giá bán, tình trạng nick và quy trình bàn giao trước khi chốt.",
  },
  {
    question: "Có nên mua acc chỉ vì giá rẻ không?",
    answer:
      "Không nên. Giá chỉ là một phần, bạn cần đối chiếu thêm mô tả, ảnh gallery và mức phù hợp với nhu cầu chơi.",
  },
  {
    question: "Sau khi nhận acc cần làm gì?",
    answer:
      "Bạn nên làm theo hướng dẫn bàn giao, đổi thông tin cần thiết và lưu lại nội dung chốt giao dịch để đối chiếu khi cần.",
  },
];

export default function BuyGuidePage() {
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Hướng dẫn mua acc OMG3Q", path: "/huong-dan-mua-acc-omg3q" },
          ]),
          buildFaqSchema(faqs),
        ].filter((item): item is Record<string, unknown> => Boolean(item))}
      />

      <MarketingShell
        eyebrow="Checklist mua acc"
        title="Hướng dẫn mua acc OMG3Q an toàn trước khi chốt giao dịch"
        description="Trang này gom các bước cần kiểm tra để bạn chọn đúng nick, tránh mua nhầm và nắm rõ quy trình bàn giao trước khi thanh toán."
        metrics={[
          { label: "Phù hợp", value: "Người mua lần đầu" },
          { label: "Tập trung", value: "Ảnh thật + mô tả + bàn giao" },
          { label: "Đi tiếp", value: "Mở danh sách acc" },
        ]}
        sectionTitle="Tư duy đúng khi chọn acc"
        sectionText="Một acc đáng mua không chỉ có giá tốt. Acc đó phải có thông tin đủ rõ để bạn biết mình nhận được gì, server nào, VIP bao nhiêu và shop sẽ bàn giao theo cách nào."
        bullets={[
          "Không chốt acc chỉ dựa trên một ảnh đại diện.",
          "Ưu tiên nick có gallery, mô tả và giá công khai.",
          "Hỏi rõ cách bàn giao trước khi chuyển khoản.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem acc OMG3Q đang bán"
      />

      <main className={styles.stack}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span className={styles.eyebrow}>5 bước nên làm</span>
              <h2 className={styles.title}>Checklist nhanh trước khi mua nick OMG3Q</h2>
            </div>
            <div className={styles.actions}>
              <Link href="/quy-trinh-giao-dich" className={styles.secondaryLink}>
                Xem quy trình
              </Link>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <strong>1. Xác định nhu cầu</strong>
              <p>Chọn trước server, quốc gia, VIP và tầm giá để tránh xem quá nhiều acc không phù hợp.</p>
            </article>
            <article className={styles.card}>
              <strong>2. Xem ảnh thật</strong>
              <p>Ưu tiên acc có nhiều ảnh gallery, thể hiện rõ thông tin trong game và tình trạng hiện tại.</p>
            </article>
            <article className={styles.card}>
              <strong>3. Đọc mô tả</strong>
              <p>Đối chiếu server, VIP, level, highlights và các ghi chú quan trọng trước khi liên hệ.</p>
            </article>
            <article className={styles.card}>
              <strong>4. Hỏi cách bàn giao</strong>
              <p>Thống nhất kênh liên hệ, thời gian giữ acc và các bước đổi thông tin sau khi nhận nick.</p>
            </article>
            <article className={styles.card}>
              <strong>5. Lưu nội dung chốt</strong>
              <p>Lưu lại tin nhắn chốt giá, mô tả và cam kết để shop hỗ trợ nhanh nếu có sai khác.</p>
            </article>
            <article className={styles.card}>
              <strong>6. Kiểm tra lại sau nhận</strong>
              <p>Sau bàn giao, đối chiếu lại acc với mô tả công khai và báo ngay nếu có điểm chưa khớp.</p>
            </article>
          </div>
        </section>

        <section className={styles.panel}>
          <div>
            <span className={styles.eyebrow}>Liên kết nên xem</span>
            <h2 className={styles.title}>Đi tiếp theo nhu cầu của bạn</h2>
          </div>
          <div className={styles.actions}>
            <Link href="/accounts" className={styles.primaryLink}>
              Mở danh sách acc
            </Link>
            <Link href="/bang-gia-nick-omg3q" className={styles.secondaryLink}>
              Xem bảng giá
            </Link>
            <Link href="/chinh-sach-bao-hanh" className={styles.secondaryLink}>
              Xem chính sách bảo hành
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
