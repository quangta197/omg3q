"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeImage = normalizedImages[activeIndex] ?? null;
  const totalImages = normalizedImages.length;

  const goNext = useCallback(() => {
    setActiveIndex((current) =>
      current < totalImages - 1 ? current + 1 : 0
    );
  }, [totalImages]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) =>
      current > 0 ? current - 1 : totalImages - 1
    );
  }, [totalImages]);

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (!touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaY) > Math.abs(deltaX) || elapsed > 500) {
      return;
    }

    if (deltaX < 0) {
      goNext();
    } else {
      goPrev();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      goPrev();
    } else if (event.key === "ArrowRight") {
      goNext();
    } else if (event.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  }

  return (
    <>
      <section className={styles.stage}>
        <div
          className={styles.stageMain}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          onClick={() => setIsFullscreen(true)}
          role="button"
          tabIndex={0}
          aria-label="Bấm để xem ảnh toàn màn hình"
        >
          {activeImage ? (
            <Image
              src={activeImage.imageUrl}
              alt={activeImage.caption || title}
              fill
              sizes="(max-width: 720px) 100vw, (max-width: 940px) 90vw, 720px"
              className={styles.stageImage}
              priority
            />
          ) : null}

          {totalImages > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navPrev}`}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navNext}`}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Ảnh tiếp"
              >
                ›
              </button>
            </>
          ) : null}

          {totalImages > 1 ? (
            <span className={styles.counter}>
              {activeIndex + 1} / {totalImages}
            </span>
          ) : null}
        </div>

        {totalImages > 1 ? (
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
                  className={styles.thumbImage}
                />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {isFullscreen ? (
        <div
          className={styles.fullscreen}
          onClick={() => setIsFullscreen(false)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-label="Xem ảnh toàn màn hình"
          tabIndex={0}
        >
          <button
            type="button"
            className={styles.fullscreenClose}
            onClick={() => setIsFullscreen(false)}
            aria-label="Đóng"
          >
            ✕
          </button>

          <div
            className={styles.fullscreenImageWrap}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {activeImage ? (
              <Image
                src={activeImage.imageUrl}
                alt={activeImage.caption || title}
                fill
                sizes="100vw"
                className={styles.fullscreenImage}
              />
            ) : null}
          </div>

          {totalImages > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.fullscreenNav} ${styles.fullscreenPrev}`}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Ảnh trước"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.fullscreenNav} ${styles.fullscreenNext}`}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Ảnh tiếp"
              >
                ›
              </button>
              <span className={styles.fullscreenCounter}>
                {activeIndex + 1} / {totalImages}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
