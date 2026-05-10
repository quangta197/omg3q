import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccountsWithFilters } from "@/lib/accounts";
import { createMetadata, formatPrice } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../route-layout.module.css";

export const revalidate = 300;

const VIP_PRICE_MIN = 3000000;

export const metadata = createMetadata({
  title: "Acc OMG3Q VIP | Nick giá từ 3 triệu, ảnh thật và thông tin rõ",
  description:
    "Tổng hợp acc OMG3Q VIP theo phân khúc giá từ 3 triệu trở lên, có ảnh thật, mô tả rõ server, quốc gia, giá và tình trạng.",
  path: "/accounts/vip",
  keywords: [
    "acc omg3q vip",
    "nick omg3q vip",
    "mua acc omg3q vip",
    "acc omg3q từ 3 triệu",
    "shop acc omg3q vip",
  ],
});

export default async function VipAccountsPage() {
  const result = await getAccountsWithFilters({
    priceMin: VIP_PRICE_MIN,
    limit: 48,
    sort: "newest",
  });
  const path = "/accounts/vip";
  const priceLabel = formatPrice(VIP_PRICE_MIN);

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách acc", path: "/accounts" },
            { name: "Acc VIP", path },
          ]),
          buildItemListSchema(path, result.items),
        ]}
      />
      <MarketingShell
        eyebrow="Acc OMG3Q VIP"
        title={`Acc OMG3Q VIP giá từ ${priceLabel} trở lên`}
        description={`Trang này gom các nick OMG3Q thuộc phân khúc VIP theo giá bán từ ${priceLabel}, phù hợp khi bạn muốn xem nhanh acc mạnh, ảnh thật và thông tin rõ trước khi chốt.`}
        metrics={[
          { label: "Số acc", value: String(result.total) },
          { label: "Giá từ", value: priceLabel },
          { label: "Tập trung", value: "Acc mạnh + ảnh thật" },
        ]}
        sectionTitle="Khi nào nên xem nhóm acc VIP"
        sectionText="Nhóm này phù hợp khi bạn đã có ngân sách từ 3 triệu trở lên và muốn rút ngắn thời gian lọc các acc phổ thông."
        bullets={[
          "Ưu tiên acc có giá trị cao hơn, mô tả rõ và gallery đầy đủ.",
          "Dễ so sánh server, quốc gia, VIP và mức giá trong cùng phân khúc.",
          "Nên mở từng acc để kiểm tra ảnh thật và tình trạng trước khi liên hệ giữ nick.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Lọc thêm trong danh sách tổng"
      />
      <div className={styles.stack}>
        <AccountGrid
          items={result.items}
          emptyMessage="Hiện chưa có acc OMG3Q VIP từ 3 triệu trở lên. Bạn có thể quay lại danh sách tổng để xem thêm các phân khúc khác."
        />
      </div>
    </>
  );
}
