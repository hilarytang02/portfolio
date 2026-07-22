import path from 'node:path';
import sharp from 'sharp';

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

  return {
    width: output.info.width,
    height: output.info.height,
    blurDataURL,
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
