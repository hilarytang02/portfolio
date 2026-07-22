'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Photo } from '@/types/photo';
import { cameraLabel } from '@/data/cameras';
import { altText } from '@/lib/photos';

interface PhotoTileProps {
  photo: Photo;
  /** Passes the tile's button so the lightbox can restore focus on close. */
  onOpen: (el: HTMLButtonElement) => void;
  /** First ~12 load eagerly for a fast first paint (PRD §8). */
  priority?: boolean;
}

const SIZES = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw';

export default function PhotoTile({ photo, onOpen, priority }: PhotoTileProps) {
  const country = photo.location.country;
  const full = `${cameraLabel(photo.medium.camera)} · ${country} · ${photo.year}`;
  const reduced = `${country} · ${photo.year}`;

  // Overflow rule (PRD §4.4): if the full line would overflow the column, drop
  // the camera label first, falling back to `{country} · {year}`. A hidden
  // measurer holding the full string lets us re-evaluate on resize both ways.
  const boxRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [showCamera, setShowCamera] = useState(true);

  useEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;
    const check = () => setShowCamera(measure.offsetWidth <= box.offsetWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget)}
      aria-label={`Open photo: ${altText(photo)}`}
      className="tile group relative block w-full overflow-hidden bg-rule/40"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <Image
        src={`/photos/${photo.filename}`}
        alt={altText(photo)}
        width={photo.width}
        height={photo.height}
        sizes={SIZES}
        placeholder={photo.blurDataURL ? 'blur' : 'empty'}
        blurDataURL={photo.blurDataURL}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        className="tile-img h-full w-full object-cover"
      />

      {/* Hover metadata overlay — fine-pointer devices only (gated in CSS). */}
      <span
        aria-hidden="true"
        className="tile-meta pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/60 via-black/15 to-transparent p-3 pt-10"
      >
        <span
          ref={boxRef}
          className="block w-full overflow-hidden whitespace-nowrap text-white"
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {showCamera ? full : reduced}
        </span>
        {/* Off-screen measurer holding the full string. */}
        <span
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute whitespace-nowrap"
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {full}
        </span>
      </span>
    </button>
  );
}
