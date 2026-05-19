"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingImageGalleryProps {
  imageUrls: string[];
  title: string;
  className?: string;
}

export function ListingImageGallery({ imageUrls, title, className }: ListingImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeUrl = imageUrls[activeIndex] ?? null;

  const prev = useCallback(
    () => setActiveIndex((i) => (i === 0 ? imageUrls.length - 1 : i - 1)),
    [imageUrls.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i === imageUrls.length - 1 ? 0 : i + 1)),
    [imageUrls.length]
  );
  const openLightbox  = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      closeLightbox();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, prev, next]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>

      {/* Main image */}
      <div
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        onClick={openLightbox}
      >
        {activeUrl ? (
          <>
            <Image
              src={activeUrl}
              alt={`${title} — foto ${activeIndex + 1}`}
              fill
              priority
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="rounded-full bg-black/40 p-2.5 backdrop-blur-sm">
                <ZoomIn className="h-5 w-5 text-white" />
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {imageUrls.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150",
                i === activeIndex
                  ? "border-blue-500 shadow-sm"
                  : "border-transparent hover:border-slate-300"
              )}
            >
              <Image
                src={url}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev / Next */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Active image */}
          <div
            className="relative max-h-[85vh] max-w-[85vw]"
            style={{ aspectRatio: "1/1" }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeUrl && (
              <Image
                src={activeUrl}
                alt={title}
                fill
                className="object-contain"
                sizes="85vw"
              />
            )}
          </div>

          {/* Counter */}
          {imageUrls.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
              {activeIndex + 1} / {imageUrls.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
