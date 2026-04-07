import Link from "next/link";
import styles from "./MarketingShell.module.css";

type MarketingShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: ReadonlyArray<{ label: string; value: string }>;
  sectionTitle: string;
  sectionText: string;
  bullets: ReadonlyArray<string>;
  ctaHref: string;
  ctaLabel: string;
};

export function MarketingShell({
  eyebrow,
  title,
  description,
  metrics,
  sectionTitle,
  sectionText,
  bullets,
  ctaHref,
  ctaLabel,
}: MarketingShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.meta}>
          {metrics.map((metric) => (
            <div key={metric.label} className={styles.metaCard}>
              <span className={styles.metaLabel}>{metric.label}</span>
              <span className={styles.metaValue}>{metric.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
        <p className={styles.sectionText}>{sectionText}</p>
        <ul className={styles.list}>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      </section>
    </main>
  );
}
