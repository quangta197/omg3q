import { notFound } from "next/navigation";
import { getAccountsByNation, getNationCodes } from "@/lib/accounts";
import { AccountGrid } from "@/components/marketing/AccountGrid";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildItemListSchema } from "@/lib/schema";
import styles from "../../../route-layout.module.css";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import type { NationCode } from "@/lib/types";

export const revalidate = 300;

const nationLabels: Record<NationCode, string> = {
  nguy: "Nguy",
  thuc: "Thuc",
  ngo: "Ngo",
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
      title: "Nhom quoc gia khong ton tai",
      description: "Landing page khong hop le.",
      path: `/accounts/nation/${nation}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `Nick OMG3Q quoc gia ${nationName}`,
    description: `Landing page mua nick OMG3Q theo quoc gia ${nationName}, phuc vu truy van co thuoc tinh chien thuat va doi hinh.`,
    path: `/accounts/nation/${nation}`,
    keywords: [`nick omg3q ${nationName.toLowerCase()}`, `mua nick omg3q ${nationName.toLowerCase()}`],
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

  if (!items.length && !isSupabaseConfigured()) {
    return (
      <MarketingShell
        eyebrow="Supabase setup required"
        title={`Landing page ${nationName} dang cho du lieu that`}
        description="Trang nay se render tu Supabase sau khi project co env va seed data. Hien tai route da san sang cho SSR va ISR that."
        metrics={[
          { label: "Cluster", value: nationName },
          { label: "Mode", value: "SSR + ISR" },
          { label: "Trang thai", value: "Cho setup" },
        ]}
        sectionTitle="Du lieu can co"
        sectionText="Can bang nations, servers va accounts trong Supabase. Sau khi seed xong, route nay se co item list va metadata dung theo quoc gia."
        bullets={[
          "Dien .env.local voi URL va anon key.",
          "Run schema.sql va seed.sql.",
          "Reload route de kiem tra output.",
        ]}
        ctaHref="/accounts"
        ctaLabel="Ve listing tong hop"
      />
    );
  }

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Trang chu", path: "/" },
            { name: "Danh sach nick", path: "/accounts" },
            { name: nationName, path: `/accounts/nation/${nation}` },
          ]),
          buildItemListSchema(`/accounts/nation/${nation}`, items),
        ]}
      />
      <MarketingShell
        eyebrow="Landing page theo quoc gia"
        title={`Nick OMG3Q ${nationName} cho user da co so thich doi hinh`}
        description={`Cluster theo quoc gia giup bat cac truy van nhu "nick OMG3Q ${nationName}" ma khong can index hang loat to hop filter mong.`}
        metrics={[
          { label: "Cum tu khoa", value: nationName },
          { label: "So nick mau", value: String(items.length) },
          { label: "Index mode", value: "Canonical self" },
        ]}
        sectionTitle="Ung dung SEO cho cluster theo quoc gia"
        sectionText="Trang nay nen duoc bo sung content so sanh doi hinh, uu diem va internal link sang account detail de tang topical depth."
        bullets={[
          "Bat truy van thuoc tinh co y dinh giao dich.",
          "Ho tro anchor text noi bo tu blog va bang gia.",
          "De mo rong thanh cluster phu cho VIP hoac muc gia.",
        ]}
        ctaHref="/blog"
        ctaLabel="Xem bai viet bo tro"
      />
      <div className={styles.stack}>
        <AccountGrid items={items} />
      </div>
    </>
  );
}
