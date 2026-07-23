import path from 'node:path';
import sharp from 'sharp';
import type { Tone } from '../types/photo';

export const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');

/** Long edge is clamped to this many px (PRD §3.1). */
export const MAX_LONG_EDGE = 2400;
export const WEBP_QUALITY = 82;
/** blurDataURL LQIP width in px (PRD §3.1). */
export const BLUR_WIDTH = 20;

export interface ProcessedImage {
  width: number;
  height: number;
  blurDataURL: string;
  tone: Tone;
}

/**
 * Resize (long edge ≤ 2400px, never upscaling), convert to webp q82, write to
 * `public/photos/{id}.webp`, and return the final intrinsic dimensions plus a
 * base64 LQIP blurDataURL. Shared by add-photo, import-photos, and the
 * placeholder generator so the pipeline stays identical everywhere.
 */
export async function processImage(
  sourceInput: string | Buffer,
  id: string,
): Promise<ProcessedImage> {
  const destPath = path.join(PHOTOS_DIR, `${id}.webp`);

  const pipeline = sharp(sourceInput as never).rotate(); // honor EXIF orientation
  const meta = await pipeline.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Could not read image dimensions from source for "${id}".`);
  }

  const longEdge = Math.max(meta.width, meta.height);
  const resizeOpts =
    longEdge > MAX_LONG_EDGE
      ? meta.width >= meta.height
        ? { width: MAX_LONG_EDGE }
        : { height: MAX_LONG_EDGE }
      : undefined;

  const output = await pipeline
    .clone()
    .resize(resizeOpts)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  await sharp(output.data).toFile(destPath);

  const blurDataURL = await makeBlurDataURL(output.data);
  const tone = await extractTone(output.data);

  return {
    width: output.info.width,
    height: output.info.height,
    blurDataURL,
    tone,
  };
}

/** Generate a tiny blurred base64 LQIP data URL from an image buffer/path. */
export async function makeBlurDataURL(
  source: string | Buffer,
): Promise<string> {
  const buffer = await sharp(source as never)
    .resize({ width: BLUR_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/**
 * Mean image color as CIELAB (used by lib/photos.ts to order the grid so
 * neighbouring photos blend tonally). Channel means are taken on a downscaled
 * copy — the mean is scale-invariant, the resize just keeps it fast.
 */
export async function extractTone(source: string | Buffer): Promise<Tone> {
  const { channels } = await sharp(source as never)
    .resize({ width: 64 })
    .removeAlpha()
    .toColourspace('srgb')
    .stats();
  const [r, g, b] = channels.map((c) => c.mean / 255);
  return rgbToLab(r, g, b);
}

/** sRGB (0–1 per channel) → CIELAB, D65 white point. Rounded to 1 decimal. */
function rgbToLab(r: number, g: number, b: number): Tone {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    l: round1(116 * fy - 16),
    a: round1(500 * (fx - fy)),
    b: round1(200 * (fy - fz)),
  };
}
