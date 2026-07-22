'use client';

import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import type { Photo } from '@/types/photo';
import PhotoTile from './PhotoTile';

interface PhotoGridProps {
  photos: Photo[];
  onOpen: (index: number, el: HTMLButtonElement) => void;
}

/** First N images load eagerly for a fast first paint (PRD §8). */
const EAGER_COUNT = 12;

/**
 * Masonry grid via CSS multi-column (PRD §4.3). Filtering re-renders the grid
 * with framer-motion transitions (PRD §5.6): items fade out (150ms), the layout
 * settles (250ms ease-out), new items fade in (200ms). `MotionConfig
 * reducedMotion="user"` honors prefers-reduced-motion by swapping instantly.
 */
export default function PhotoGrid({ photos, onOpen }: PhotoGridProps) {
  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="photo-columns">
          <AnimatePresence mode="popLayout" initial={false}>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } }}
                transition={{
                  opacity: { duration: 0.2, ease: 'easeOut' },
                  layout: { duration: 0.25, ease: 'easeOut' },
                }}
              >
                <PhotoTile
                  photo={photo}
                  priority={i < EAGER_COUNT}
                  onOpen={(el) => onOpen(i, el)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
