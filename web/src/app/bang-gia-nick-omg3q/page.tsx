import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Bang gia nick OMG3Q theo VIP, server va luc chien",
  description:
    "Landing page bang gia de bat truy van research truoc giao dich, dong thoi dan authority sang listing va detail.",
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
        eyebrow="Research intent"
        title="Bang gia nick OMG3Q la trang trust quan trong, khong phai phan phu."
        description="Nguoi dung truoc khi giao dich thuong tim khung gia theo VIP, server va chat luong doi hinh. Trang nay giup site bat intent research, sau do dan sang trang listing va chi tiet."
        metrics={[
          { label: "VIP 8", value: "1.5m - 2.5m" },
          { label: "VIP 10", value: "3m - 4.5m" },
          { label: "VIP 12", value: "5m+" },
        ]}
        sectionTitle="Nguyen tac giu bang gia co gia tri SEO"
        sectionText="Khong viet chung chung. Can cap nhat theo bien dong thi truong, chen vi du thuc te va internal link ve landing page phu hop."
        bullets={[
          "Cap nhat co chu ky de GSC nhan thay freshness.",
          "Chen FAQ ve giao dich va cach dinh gia nick.",
          "Dan link den cac cum server va cac account mau.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem nick dang san"
      />
    </>
  );
}
