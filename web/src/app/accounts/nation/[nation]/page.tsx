import { notFound } from "next/navigation";
import { getAccountsByNation, getNationCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";
import type { NationCode } from "@/lib/types";

export const revalidate = 300;

const nationLabels: Record<NationCode, string> = {
  nguy: "Ngụy",
  thuc: "Thục",
  ngo: "Ngô",
};

type NationLandingPageProps = {
  params: Promise<{ nation: string }>;
};

export async function generateStaticParams() {
  const nations = await getNationCodes();
  return nations.map((nation) => ({ nation }));
}

export async function generateMetadata({ params }: NationLandingPageProps) {
  const { nation } = await params;
  const nationName = nationLabels[nation as NationCode];

  if (!nationName) {
    return createMetadata({
      title: "Nhóm quốc gia không tồn tại",
      description: "Landing page không hợp lệ.",
      path: `/accounts/nation/${nation}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `Acc OMG3Q quốc gia ${nationName}`,
    description: `Tổng hợp acc OMG3Q quốc gia ${nationName} để xem nhanh đội hình, VIP và giá bán phù hợp.`,
    path: `/accounts/nation/${nation}`,
    keywords: [
      `acc omg3q ${nationName.toLowerCase()}`,
      `mua acc omg3q ${nationName.toLowerCase()}`,
      `nick omg3q ${nationName.toLowerCase()}`,
    ],
  });
}

export default async function NationLandingPage({
  params,
}: NationLandingPageProps) {
  const { nation } = await params;
  const nationName = nationLabels[nation as NationCode];

  if (!nationName) {
    notFound();
  }

  const items = await getAccountsByNation(nation);

  if (!items.length) {
    return (
      <MarketingShell
        eyebrow={`Quốc gia ${nationName}`}
        title={`Hiện chưa có acc OMG3Q quốc gia ${nationName}`}
        description="Danh sách sẽ được cập nhật sớm. Bạn có thể xem các quốc gia khác hoặc quay lại trang tổng hợp để lọc nhanh hơn."
        metrics={[
          { label: "Quốc gia", value: nationName },
          { label: "Trạng thái", value: "Đang cập nhật" },
          { label: "Gợi ý", value: "Xem nhóm khác" },
        ]}
        sectionTitle="Bạn có thể làm gì tiếp theo"
        sectionText="Nếu muốn chốt acc sớm, hãy xem danh sách tổng để lọc theo server, giá hoặc nhắn shop để được tư vấn."
        bullets={[
          "Mở danh sách đầy đủ để lọc theo server và mức giá.",
          "Xem thêm các quốc gia khác đang có tài khoản phù hợp.",
          "Liên hệ shop để được gửi các acc gần đúng nhu cầu.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Về danh sách tổng"
      />
    );
  }

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách acc", path: "/accounts" },
            { name: nationName, path: `/accounts/nation/${nation}` },
          ]),
          buildItemListSchema(`/accounts/nation/${nation}`, items),
        ]}
      />
      <MarketingShell
        eyebrow="Danh sách theo quốc gia"
        title={`Acc OMG3Q quốc gia ${nationName} đang bán`}
        description={`Tổng hợp các tài khoản ${nationName} để bạn xem nhanh đội hình, VIP và giá bán phù hợp.`}
        metrics={[
          { label: "Quốc gia", value: nationName },
          { label: "Số acc", value: String(items.length) },
          { label: "Tình trạng", value: "Đang cập nhật" },
        ]}
        sectionTitle="Phù hợp với ai"
        sectionText="Trang này phù hợp khi bạn đã quen một quốc gia và muốn rút ngắn thời gian so sánh trước khi chốt acc."
        bullets={[
          "Xem nhanh các acc cùng nhóm tướng quen dùng.",
          "Dễ so sánh mức giá giữa các tài khoản cùng quốc gia.",
          "Mở từng trang chi tiết để kiểm tra ảnh và mô tả trước khi chốt.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem toàn bộ acc"
      />
      <div className={styles.stack}>
        <AccountGrid items={items} />
      </div>
    </>
  );
}
