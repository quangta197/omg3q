import { getAccountsByServer, getServerCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";

export const revalidate = 300;

type ServerLandingPageProps = {
  params: Promise<{ server: string }>;
};

export async function generateStaticParams() {
  const servers = await getServerCodes();
  return servers.map((server) => ({ server }));
}

export async function generateMetadata({ params }: ServerLandingPageProps) {
  const { server } = await params;

  return createMetadata({
    title: `Nick OMG3Q ${server.toUpperCase()} uy tín, giá tốt`,
    description: `Tổng hợp nick OMG3Q server ${server.toUpperCase()} với nhiều mức VIP và giá bán để chọn nhanh tài khoản phù hợp.`,
    path: `/accounts/server/${server}`,
    keywords: [`nick omg3q ${server}`, `mua nick omg3q ${server}`],
  });
}

export default async function ServerLandingPage({
  params,
}: ServerLandingPageProps) {
  const { server } = await params;
  const items = await getAccountsByServer(server);

  if (!items.length) {
    return (
      <MarketingShell
        eyebrow={`Server ${server.toUpperCase()}`}
        title={`Hiện chưa có nick OMG3Q ở server ${server.toUpperCase()}`}
        description="Danh sách sẽ được cập nhật sớm. Bạn có thể xem các server khác hoặc quay lại trang tổng hợp để lọc nhanh hơn."
        metrics={[
          { label: "Server", value: server.toUpperCase() },
          { label: "Trạng thái", value: "Đang cập nhật" },
          { label: "Gợi ý", value: "Xem server khác" },
        ]}
        sectionTitle="Bạn có thể làm gì tiếp theo"
        sectionText="Nếu cần nick gấp, hãy mở danh sách tổng để lọc theo giá hoặc liên hệ shop để được tư vấn nhanh."
        bullets={[
          "Mở danh sách đầy đủ để lọc theo giá.",
          "Xem thêm các server đang có nhiều nick hơn.",
          "Nhắn Zalo hoặc Facebook để shop gợi ý tài khoản phù hợp.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Mở danh sách tổng"
      />
    );
  }

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Danh sách nick", path: "/accounts" },
            {
              name: `Server ${server.toUpperCase()}`,
              path: `/accounts/server/${server}`,
            },
          ]),
          buildItemListSchema(`/accounts/server/${server}`, items),
        ]}
      />
      <MarketingShell
        eyebrow="Danh sách theo server"
        title={`Nick OMG3Q server ${server.toUpperCase()} đang bán`}
        description={`Chọn nhanh các tài khoản thuộc server ${server.toUpperCase()}, so sánh giá và tình trạng trước khi chốt.`}
        metrics={[
          { label: "Số nick", value: String(items.length) },
          { label: "Server", value: server.toUpperCase() },
          { label: "Tình trạng", value: "Đang cập nhật" },
        ]}
        sectionTitle="Phù hợp với ai"
        sectionText="Trang này phù hợp khi bạn đã chốt sẵn server và chỉ muốn xem nhanh các nick đang bán trong cùng nhóm."
        bullets={[
          "So sánh nhanh giá bán giữa các nick cùng server.",
          "Dễ chọn tài khoản đúng tiến độ chơi hiện tại.",
          "Có thể mở từng nick để xem ảnh, mô tả và liên hệ ngay.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Xem toàn bộ nick"
      />
      <div className={styles.stack}>
        <AccountGrid items={items} />
      </div>
    </>
  );
}
