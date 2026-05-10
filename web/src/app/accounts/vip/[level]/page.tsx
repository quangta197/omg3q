import { notFound } from "next/navigation";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccountsByVip, getVipLevels } from "@/lib/accounts";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";

export const revalidate = 300;

type VipLandingPageProps = {
  params: Promise<{ level: string }>;
};

function parseVipLevel(value: string) {
  const level = Number(value);

  if (!Number.isInteger(level) || level <= 0 || level > 99) {
    return null;
  }

  return level;
}

export async function generateStaticParams() {
  const levels = await getVipLevels();
  return levels.map((level) => ({ level: String(level) }));
}

export async function generateMetadata({ params }: VipLandingPageProps) {
  const level = parseVipLevel((await params).level);

  if (!level) {
    return createMetadata({
      title: "Nhóm VIP không tồn tại",
      description: "Landing page VIP không hợp lệ.",
      path: "/accounts/vip",
      noIndex: true,
    });
  }

  return createMetadata({
    title: `Acc OMG3Q VIP ${level} | Nick VIP ${level} có ảnh thật, giá rõ`,
    description: `Tổng hợp acc OMG3Q VIP ${level} đang bán, có ảnh thật, mô tả rõ server, quốc gia, giá và tình trạng để chọn nhanh nick phù hợp.`,
    path: `/accounts/vip/${level}`,
    keywords: [
      `acc omg3q vip ${level}`,
      `nick omg3q vip ${level}`,
      `mua acc omg3q vip ${level}`,
      `shop acc omg3q vip ${level}`,
    ],
  });
}

export default async function VipLandingPage({ params }: VipLandingPageProps) {
  const level = parseVipLevel((await params).level);

  if (!level) {
    notFound();
  }

  const items = await getAccountsByVip(level);
  const path = `/accounts/vip/${level}`;

  if (!items.length) {
    return (
      <MarketingShell
        eyebrow={`VIP ${level}`}
        title={`Hiện chưa có acc OMG3Q VIP ${level} đang mở bán`}
        description="Kho acc được cập nhật liên tục. Bạn có thể xem toàn bộ danh sách hoặc liên hệ shop để được lọc acc gần đúng nhu cầu."
        metrics={[
          { label: "Phân khúc", value: `VIP ${level}` },
          { label: "Trạng thái", value: "Đang cập nhật" },
          { label: "Gợi ý", value: "Xem tầm giá khác" },
        ]}
        sectionTitle="Nên làm gì tiếp theo"
        sectionText="Nếu chưa thấy đúng acc VIP cần tìm, hãy mở danh sách tổng để lọc theo server, quốc gia và giá hoặc nhắn shop để được gửi acc phù hợp."
        bullets={[
          "Mở danh sách tổng để xem các VIP gần kề.",
          "Lọc thêm theo server và quốc gia để rút ngắn lựa chọn.",
          "Liên hệ Zalo nếu cần giữ acc hoặc săn acc VIP theo yêu cầu.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem toàn bộ acc OMG3Q"
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
            { name: `VIP ${level}`, path },
          ]),
          buildItemListSchema(path, items),
        ]}
      />
      <MarketingShell
        eyebrow={`Acc OMG3Q VIP ${level}`}
        title={`Acc OMG3Q VIP ${level} đang bán, có ảnh thật và giá rõ`}
        description={`Danh sách nick OMG3Q VIP ${level} được gom riêng để bạn so sánh nhanh server, quốc gia, giá và tình trạng trước khi liên hệ giữ acc.`}
        metrics={[
          { label: "Số acc", value: String(items.length) },
          { label: "Phân khúc", value: `VIP ${level}` },
          { label: "Kiểm tra", value: "Ảnh + mô tả + giá" },
        ]}
        sectionTitle="Khi nào nên chọn nhóm VIP này"
        sectionText={`Acc VIP ${level} phù hợp khi bạn đã xác định rõ ngân sách và muốn rút ngắn thời gian so sánh, thay vì mở toàn bộ kho acc rồi lọc thủ công từng tài khoản.`}
        bullets={[
          "So sánh nhanh các acc cùng cấp VIP.",
          "Đối chiếu thêm server, quốc gia và mức giá để tránh mua lệch nhu cầu.",
          "Mở từng acc để xem gallery ảnh thật và thông tin bàn giao trước khi chốt.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Lọc thêm trong danh sách tổng"
      />
      <div className={styles.stack}>
        <AccountGrid items={items} />
      </div>
    </>
  );
}
