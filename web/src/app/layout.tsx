import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { FloatingContact } from "@/components/chrome/FloatingContact";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata, getSiteUrl, siteConfig } from "@/lib/seo";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-primary",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  ...createMetadata({
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    path: "/",
    keywords: siteConfig.defaultKeywords,
  }),
  metadataBase: new URL(getSiteUrl()),
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const storedTheme = localStorage.getItem("theme");
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                document.documentElement.dataset.theme = storedTheme || systemTheme;
              })();
            `,
          }}
        />
        <JsonLd data={buildOrganizationSchema()} />
        <JsonLd data={buildWebsiteSchema()} />
        <div className="siteShell">
          <SiteHeader />
          <div className="siteContent">{children}</div>
          <SiteFooter />
        </div>
        <FloatingContact />
      </body>
    </html>
  );
}
