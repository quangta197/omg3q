import { notFound } from "next/navigation";
import { getAccountsByServer, getServerCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";
import { isSupabaseConfigured } from "@/lib/supabase-server";

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
    title: `Nick OMG3Q ${server.toUpperCase()} uy tin, gia tot`,
    description: `Landing page giao dich cho tu khoa nick OMG3Q ${server.toUpperCase()}, tap trung account co y dinh mua cao.`,
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
    if (!isSupabaseConfigured()) {
      return (
        <MarketingShell
          eyebrow="Supabase setup required"
          title={`Landing page server ${server.toUpperCase()} dang cho du lieu that`}
          description="Route da duoc noi vao query layer Supabase. Sau khi import schema va seed, trang nay se bat dau co noi dung indexable theo server."
          metrics={[
            { label: "Data source", value: "Supabase" },
            { label: "Mode", value: "SSR + ISR" },
            { label: "Trang thai", value: "Cho setup" },
          ]}
          sectionTitle="Can lam gi tiep theo"
          sectionText="Dien env va import SQL de co account, server, nation that. Khi co data, route nay tu dong dung cho SEO landing page."
          bullets={[
            "Run database/schema.sql.",
            "Run database/seed.sql.",
            "Them thong tin Supabase vao web/.env.local.",
          ]}
          ctaHref="/accounts"
          ctaLabel="Mo listing tong hop"
        />
      );
    }

    notFound();
  }

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chu", path: "/" },
            { name: "Danh sach nick", path: "/accounts" },
            { name: `Server ${server.toUpperCase()}`, path: `/accounts/server/${server}` },
          ]),
          buildItemListSchema(`/accounts/server/${server}`, items),
        ]}
      />
      <MarketingShell
        eyebrow="Landing page theo server"
        title={`Nick OMG3Q server ${server.toUpperCase()} cho truy van giao dich ro rang`}
        description={`Trang nay duoc tao de don truy van mua nick OMG3Q ${server.toUpperCase()}, giup site rank dung intent thay vi don authority vao mot URL listing tong hop.`}
        metrics={[
          { label: "So nick mau", value: String(items.length) },
          { label: "Intent", value: "Transaction" },
          { label: "Trang thai", value: "Index" },
        ]}
        sectionTitle="Tai sao can tach landing page theo server"
        sectionText="Nguoi dung tim theo server thuong da co y dinh mua ro. Tao URL indexable theo server de noi dung du day, co H1 ro nghia va de internal link tu home/blog."
        bullets={[
          "Cho phep title/meta dung tu khoa chinh xac hon.",
          "Tranh phu thuoc vao query params de tao page cho crawler.",
          "De nhan backlinks noi bo tu blog bang gia va huong dan.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Mo listing tong hop"
      />
      <div className={styles.stack}>
        <AccountGrid items={items} />
      </div>
    </>
  );
}
