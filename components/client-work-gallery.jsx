"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const AUTO_PLAY_INTERVAL = 4000;

export default function ClientWorkGallery({ project }) {
  const images = project.images || [];
  const hasMultiple = images.length > 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(hasMultiple);
  const timerRef = useRef(null);

  const goTo = useCallback((i) => setActiveIndex(i), []);
  const goNext = useCallback(() => setActiveIndex((prev) => (prev + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length), [images.length]);

  // Auto-play
  useEffect(() => {
    if (isPlaying && hasMultiple) {
      timerRef.current = setInterval(goNext, AUTO_PLAY_INTERVAL);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, hasMultiple, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " " && hasMultiple) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, hasMultiple]);

  if (!images.length) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
        <img
          key={activeIndex}
          src={images[activeIndex]}
          alt={`${project.title} — Image ${activeIndex + 1}`}
          className="h-full w-full object-cover animate-fadeIn"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black/70 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-black sm:h-12 sm:w-12"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black/70 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:text-black sm:h-12 sm:w-12"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex items-center justify-between border-t border-border bg-white px-4 py-3 sm:px-6">
          <span className="font-mono text-xs tracking-wider text-muted">
            {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-border-strong hover:bg-muted"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      )}

      {hasMultiple && (
        <div className="border-t border-border p-4 bg-surface">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(i)}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  i === activeIndex
                    ? "border-accent shadow-md ring-1 ring-accent/30"
                    : "border-border opacity-60 hover:opacity-100 hover:border-border-strong"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={src}
                  alt={`${project.title} thumbnail ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
