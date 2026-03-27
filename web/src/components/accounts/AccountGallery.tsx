"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import styles from "./AccountGallery.module.css";

type GalleryImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

type AccountGalleryProps = {
  title: string;
  images: GalleryImage[];
};

export function AccountGallery({ title, images }: AccountGalleryProps) {
  const normalizedImages = useMemo(() => {
    const seen = new Set<string>();

    return images.filter((image) => {
      if (!image.imageUrl || seen.has(image.imageUrl)) {
        return false;
      }

      seen.add(image.imageUrl);
      return true;
    });
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = normalizedImages[activeIndex] ?? null;

  return (
    <section className={styles.stage}>
      <div className={styles.stageMain}>
        {activeImage ? (
          <Image
            src={activeImage.imageUrl}
            alt={activeImage.caption || title}
            fill
            sizes="(max-width: 900px) 100vw, 820px"
            unoptimized
            className={styles.stageImage}
          />
        ) : null}

        {/* <div className={styles.stageOverlay}>
          <div className={styles.stageContent}>
            <h1 className={styles.stageTitle}>{title}</h1>
            <p className={styles.stageText}>
              {activeImage?.caption || "Ảnh tài khoản sẽ hiển thị tại đây."}
            </p>
          </div>
          <span className={styles.stageHint}>Preview</span>
        </div> */}
      </div>

      <div className={styles.thumbStrip}>
        {normalizedImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={`${styles.thumb} ${index === activeIndex ? styles.thumbActive : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Xem ${image.caption || `ảnh ${index + 1}`}`}
            aria-pressed={index === activeIndex}
          >
            <Image
              src={image.imageUrl}
              alt={image.caption || `${title} - ảnh ${index + 1}`}
              fill
              sizes="72px"
              unoptimized
              className={styles.thumbImage}
            />
            {/* <span className={styles.thumbLabel}>Ảnh {index + 1}</span> */}
          </button>
        ))}
      </div>
    </section>
  );
}
