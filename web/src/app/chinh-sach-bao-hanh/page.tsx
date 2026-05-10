import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import styles from "../trust-page.module.css";

export const metadata = createMetadata({
  title: "Chính sách bảo hành acc OMG3Q | Hỗ trợ sau khi mua nick",
  description:
    "Chính sách hỗ trợ sau khi mua acc OMG3Q: phạm vi bảo hành, điều kiện đối chiếu mô tả, lưu ý khi nhận nick và kênh liên hệ hỗ trợ.",
  path: "/chinh-sach-bao-hanh",
  keywords: [
    "bảo hành acc omg3q",
    "chính sách mua acc omg3q",
    "hỗ trợ sau khi mua nick omg3q",
    "shop acc omg3q uy tín",
  ],
});

const faqs = [
  {
    question: "Shop hỗ trợ gì sau khi mua acc?",
    answer:
      "Shop hỗ trợ đối chiếu thông tin đã chốt, hướng dẫn các bước cần làm sau bàn giao và xử lý các sai khác lớn nếu có căn cứ rõ ràng.",
  },
  {
    question: "Khách cần lưu lại gì sau giao dịch?",
    answer:
      "Bạn nên lưu lại tin nhắn chốt, mã acc, giá, mô tả và ảnh liên quan để việc hỗ trợ sau giao dịch nhanh hơn.",
  },
  {
    question: "Khi nào cần báo shop ngay?",
    answer:
      "Hãy báo ngay khi phát hiện thông tin nhận được khác đáng kể so với mô tả đã chốt hoặc cần hỗ trợ các bước bàn giao.",
  },
];

export default function WarrantyPolicyPage() {
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Chính sách bảo hành", path: "/chinh-sach-bao-hanh" },
          ]),
          buildFaqSchema(faqs),
        ].filter((item): item is Record<string, unknown> => Boolean(item))}
      />

      <MarketingShell
        eyebrow="Chính sách hỗ trợ"
        title="Chính sách bảo hành và hỗ trợ sau khi mua acc OMG3Q"
        description="Chính sách này giúp khách hiểu rõ phạm vi hỗ trợ, cách đối chiếu mô tả đã chốt và các lưu ý cần làm ngay sau khi nhận nick."
        metrics={[
          { label: "Tập trung", value: "Đối chiếu mô tả" },
          { label: "Cần lưu", value: "Tin nhắn + mã acc" },
          { label: "Kênh xử lý", value: "Zalo / Messenger" },
        ]}
        sectionTitle="Nguyên tắc hỗ trợ"
        sectionText="Shop xử lý dựa trên thông tin đã chốt công khai hoặc trong cuộc trao đổi giao dịch. Càng lưu đủ nội dung chốt, việc hỗ trợ càng nhanh và rõ."
        bullets={[
          "Đối chiếu theo ảnh, mô tả và trạng thái đã chốt.",
          "Báo sớm nếu có sai khác lớn sau khi nhận acc.",
          "Không tự ý thay đổi quá nhiều bước trước khi báo lỗi cần hỗ trợ.",
        ]}
        ctaHref="/lien-he"
        ctaLabel="Gửi yêu cầu hỗ trợ"
      />

      <main className={styles.stack}>
        <section className={styles.panel}>
          <div>
            <span className={styles.eyebrow}>Phạm vi hỗ trợ</span>
            <h2 className={styles.title}>Những trường hợp shop ưu tiên xử lý</h2>
          </div>

          <ul className={styles.list}>
            <li>Thông tin acc nhận được khác rõ so với mô tả đã chốt trong giao dịch.</li>
            <li>Khách cần hướng dẫn các bước kiểm tra, bàn giao hoặc đổi thông tin sau khi nhận nick.</li>
            <li>Khách cần đối chiếu lại giá, mã acc, server, VIP hoặc trạng thái đã thỏa thuận.</li>
            <li>Khách gặp lỗi phát sinh ngay trong quá trình nhận acc và báo sớm qua kênh hỗ trợ.</li>
          </ul>
        </section>

        <section className={styles.panel}>
          <div>
            <span className={styles.eyebrow}>Lưu ý quan trọng</span>
            <h2 className={styles.title}>Cách giúp việc bảo hành rõ ràng hơn</h2>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <strong>Lưu nội dung chốt</strong>
              <p>Giữ lại tin nhắn xác nhận acc, giá, thời gian và mô tả để làm căn cứ đối chiếu.</p>
            </article>
            <article className={styles.card}>
              <strong>Kiểm tra ngay khi nhận</strong>
              <p>Đối chiếu server, VIP, ảnh, level và highlights trước khi sử dụng sâu.</p>
            </article>
            <article className={styles.card}>
              <strong>Báo lỗi qua đúng kênh</strong>
              <p>Gửi thông tin qua Zalo, Messenger hoặc form liên hệ để shop có lịch sử xử lý rõ.</p>
            </article>
          </div>

          <div className={styles.actions}>
            <Link href="/quy-trinh-giao-dich" className={styles.primaryLink}>
              Xem quy trình giao dịch
            </Link>
            <Link href="/accounts" className={styles.secondaryLink}>
              Quay lại danh sách acc
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
