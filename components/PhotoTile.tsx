'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Photo } from '@/types/photo';
import { cameraLabel } from '@/data/cameras';
import { filmStockShort } from '@/data/film-stocks';
import { altText } from '@/lib/photos';

interface PhotoTileProps {
  photo: Photo;
  /** Passes the tile's button so the lightbox can restore focus on close. */
  onOpen: (el: HTMLButtonElement) => void;
  /** First ~12 load eagerly for a fast first paint (PRD §8). */
  priority?: boolean;
}

const SIZES = '(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw';

const META_STYLE = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
} as const;

type Tier = 'full' | 'short' | 'reduced';

export default function PhotoTile({ photo, onOpen, priority }: PhotoTileProps) {
  const country = photo.location.country;
  // Film photos lead with the film stock (more telling than the fixed camera);
  // digital/phone lead with the camera.
  const film = photo.medium.type === 'film' ? photo.medium.filmStock : undefined;
  const lead = film ?? cameraLabel(photo.medium.camera);
  const shortLead = film ? filmStockShort(film) : lead;

  const full = `${lead} · ${country} · ${photo.year}`;
  const short = `${shortLead} · ${country} · ${photo.year}`;
  const reduced = `${country} · ${photo.year}`;

  // Overflow rule (PRD §4.4), widened to three tiers: full name, then the
  // stock's short form, then `{country} · {year}`. The middle tier matters
  // because for a film frame the stock is the most telling thing on the line —
  // going straight from "LomoChrome Metropolis 100-400" to "US · 2023" throws
  // away the best of the caption to save 2px. Hidden measurers hold each
  // candidate so resize can re-evaluate in both directions.
  const boxRef = useRef<HTMLSpanElement>(null);
  const fullRef = useRef<HTMLSpanElement>(null);
  const shortRef = useRef<HTMLSpanElement>(null);
  const [tier, setTier] = useState<Tier>('full');

  useEffect(() => {
    const box = boxRef.current;
    const mFull = fullRef.current;
    const mShort = shortRef.current;
    if (!box || !mFull || !mShort) return;
    const check = () => {
      const w = box.offsetWidth;
      setTier(
        mFull.offsetWidth <= w ? 'full' : mShort.offsetWidth <= w ? 'short' : 'reduced',
      );
    };
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
          style={META_STYLE}
        >
          {tier === 'full' ? full : tier === 'short' ? short : reduced}
        </span>
        {/* Off-screen measurers, one per candidate line. */}
        <span
          ref={fullRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute whitespace-nowrap"
          style={META_STYLE}
        >
          {full}
        </span>
        <span
          ref={shortRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute whitespace-nowrap"
          style={META_STYLE}
        >
          {short}
        </span>
      </span>
    </button>
  );
}
