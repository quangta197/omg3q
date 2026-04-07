import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Bang gia nick OMG3Q theo VIP, server va doi hinh",
  description:
    "Bang gia nick OMG3Q tham khao theo VIP, server va chat luong doi hinh de ban uoc luong ngan sach nhanh hon.",
  path: "/bang-gia-nick-omg3q",
  keywords: ["bang gia nick omg3q", "gia nick omg3q vip 12", "nick omg3q gia re"],
});

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Trang chu", path: "/" },
          { name: "Bang gia nick OMG3Q", path: "/bang-gia-nick-omg3q" },
        ])}
      />
      <MarketingShell
        eyebrow="Bảng giá tham khảo"
        title="Bảng giá nick OMG3Q theo VIP, server và độ hiếm đội hình"
        description="Khung giá dưới đây giúp bạn ước lượng nhanh ngân sách trước khi xem từng nick cụ thể và trao đổi chi tiết với shop."
        metrics={[
          { label: "VIP 8", value: "1.5m - 2.5m" },
          { label: "VIP 10", value: "3m - 4.5m" },
          { label: "VIP 12", value: "5m+" },
        ]}
        sectionTitle="Yếu tố ảnh hưởng đến giá nick"
        sectionText="Ngoài VIP, giá còn phụ thuộc vào độ hiếm tướng, tài nguyên đang có, server đang chơi và tình trạng tài khoản."
        bullets={[
          "Nick có đội hình đẹp, tài nguyên dày thường giữ giá tốt hơn.",
          "Server hot hoặc tài khoản có sẵn nền mạnh sẽ có chênh lệch giá rõ hơn.",
          "Nên xem ảnh thật và mô tả chi tiết trước khi chốt theo tầm tiền.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem nick đang bán"
      />
    </>
  );
}
