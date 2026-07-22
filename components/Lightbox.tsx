'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { Photo } from '@/types/photo';
import { cameraLabel } from '@/data/cameras';
import { altText } from '@/lib/photos';

interface LightboxProps {
  /** The currently filtered set — navigation stays within it (PRD §6). */
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const SIZES = '(max-width: 767px) 92vw, 82vw';
const META_STYLE = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
} as const;

function MetaLines({ photo }: { photo: Photo }) {
  const { city, country, continent } = photo.location;
  const isFilm = photo.medium.type === 'film';
  const medium = isFilm
    ? `${cameraLabel(photo.medium.camera)} · ${photo.medium.filmStock}`
    : cameraLabel(photo.medium.camera);

  return (
    <div className="flex flex-col gap-1.5 text-ink-secondary" style={META_STYLE}>
      <span>{`${city}, ${country} · ${continent}`}</span>
      <span>{medium}</span>
      <span>{`${photo.year} · ${photo.category}`}</span>
    </div>
  );
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: LightboxProps) {
  const open = index !== null;
  const photo = open ? photos[index] : undefined;
  const hasPrev = open && index > 0;
  const hasNext = open && index < photos.length - 1;

  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    if (index !== null && index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);
  const goNext = useCallback(() => {
    if (index !== null && index < photos.length - 1) onIndexChange(index + 1);
  }, [index, photos.length, onIndexChange]);

  // Keyboard: arrows navigate, Esc closes, Tab is trapped within the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowLeft') return goPrev();
      if (e.key === 'ArrowRight') return goNext();
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement;
        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext]);

  // Lock body scroll while open, and move focus into the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(250, 250, 248, 0.97)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={altText(photo)}
          ref={dialogRef}
          tabIndex={-1}
        >
          <motion.div
            className="flex flex-col items-center px-4 md:px-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              if (start === null) return;
              const dx = e.changedTouches[0].clientX - start;
              if (dx <= -50) goNext();
              else if (dx >= 50) goPrev();
              touchStartX.current = null;
            }}
          >
            <div className="relative flex items-center justify-center">
              <Image
                key={photo.id}
                src={`/photos/${photo.filename}`}
                alt={altText(photo)}
                width={photo.width}
                height={photo.height}
                sizes={SIZES}
                placeholder={photo.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={photo.blurDataURL}
                priority
                className="h-auto w-auto object-contain"
                style={{ maxHeight: '82vh', maxWidth: '82vw' }}
              />
            </div>

            <div className="mt-6 flex flex-col items-start text-left md:items-center md:text-center">
              {photo.title && (
                <p
                  className="mb-4 text-ink"
                  style={{ fontSize: '14px' }}
                >
                  {photo.title}
                </p>
              )}
              <MetaLines photo={photo} />
            </div>
          </motion.div>

          {/* Close (top-right, 24px inset). */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="absolute right-6 top-6 text-ink-secondary transition-colors hover:text-ink"
            style={{ fontSize: '28px', lineHeight: 1 }}
          >
            ×
          </button>

          {/* Prev / next — hidden (not disabled) at the ends (PRD §6). */}
          {hasPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-ink-secondary transition-colors hover:text-ink md:left-8"
              style={{ fontSize: '24px', lineHeight: 1 }}
            >
              ‹
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-ink-secondary transition-colors hover:text-ink md:right-8"
              style={{ fontSize: '24px', lineHeight: 1 }}
            >
              ›
            </button>
          )}

          {/* Preload the neighbors so navigation is instant (PRD §6). */}
          <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
            {hasPrev && (
              <Image
                src={`/photos/${photos[index - 1].filename}`}
                alt=""
                width={photos[index - 1].width}
                height={photos[index - 1].height}
                sizes={SIZES}
                priority
              />
            )}
            {hasNext && (
              <Image
                src={`/photos/${photos[index + 1].filename}`}
                alt=""
                width={photos[index + 1].width}
                height={photos[index + 1].height}
                sizes={SIZES}
                priority
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
