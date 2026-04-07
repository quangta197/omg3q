import Image from "next/image";
import Link from "next/link";
import type { AccountSummary } from "@/lib/types";
import { formatPrice } from "@/lib/seo";
import styles from "./AccountGrid.module.css";

type AccountGridProps = {
  items: AccountSummary[];
  emptyMessage?: string;
};

export function AccountGrid({
  items,
  emptyMessage = "Chưa có dữ liệu account từ Supabase. Hãy setup env và seed database.",
}: AccountGridProps) {
  if (!items.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.grid}>
      {items.map((account) => (
        <article key={account.slug} className={styles.card}>
          <div
            className={[
              styles.media,
              account.thumbnailUrl ? styles.mediaImage : "",
              account.nation === "nguy"
                ? styles.mediaNguy
                : account.nation === "thuc"
                  ? styles.mediaThuc
                  : account.nation === "ngo"
                    ? styles.mediaNgo
                    : "",
            ].join(" ")}
          >
            {account.thumbnailUrl ? (
              <Image
                src={account.thumbnailUrl}
                alt={account.title}
                fill
                sizes="(max-width: 900px) 100vw, (max-width: 1180px) 33vw, 25vw"
                className={styles.mediaImageTag}
                unoptimized
              />
            ) : null}

            <span className={styles.badgeHot}>
              {account.isFeatured ? "HOT" : "MỚI"}
            </span>
            {account.imageCount > 0 ? (
              <span className={styles.galleryCount}>{account.imageCount}</span>
            ) : null}
          </div>
          <div className={styles.body}>
            <div>
              <div className={styles.price}>{formatPrice(account.price)}</div>
              {account.installmentPrice ? (
                <div className={styles.installment}>
                  Góp từ {formatPrice(account.installmentPrice)}
                </div>
              ) : null}
            </div>
            <h2 className={styles.title}>{account.title}</h2>
            <div className={styles.metaLine}>
              <span>S{account.server.replace("s", "")}</span>
              <span>VIP {account.vipLevel}</span>
            </div>
            <div className={styles.highlights}>
              {account.highlights.slice(0, 3).map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
            <div className={styles.footer}>
              <span className={styles.trust}>Uy tín 100%</span>
              <Link href={`/accounts/${account.slug}`} className={styles.link}>
                Xem chi tiết
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
