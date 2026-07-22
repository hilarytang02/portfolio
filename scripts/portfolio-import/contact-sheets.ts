/**
 * One-off: renders labeled contact sheets from the manifest so categories can be
 * classified visually. Each cell shows its manifest index (+ medium/city) so the
 * classification maps back unambiguously. HEIC/HEIF are converted via `sips`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const OUT_DIR = process.env.OUT_DIR || '/tmp/portfolio-import';
const TMP = path.join(OUT_DIR, 'tmp');
const SHEETS = path.join(OUT_DIR, 'sheets');

const COLS = 5;
const ROWS = 4;
const PER = COLS * ROWS;
const CW = 384;
const CH = 300;

interface Entry {
  index: number;
  source: string;
  base: string;
  medium: string;
  city: string;
  country: string;
  year: number;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function thumbBuffer(e: Entry): Promise<Buffer> {
  let src = e.source;
  const ext = path.extname(src).toLowerCase();
  if (ext === '.heic' || ext === '.heif') {
    const jpg = path.join(TMP, `${e.index}.jpg`);
    execFileSync('sips', ['-s', 'format', 'jpeg', src, '--out', jpg], { stdio: 'ignore' });
    src = jpg;
  }
  const thumb = await sharp(src)
    .rotate()
    .resize(CW, CH, { fit: 'contain', background: '#e8e8e4' })
    .toBuffer();

  const label = `<svg width="${CW}" height="34" xmlns="http://www.w3.org/2000/svg">
    <rect width="${CW}" height="34" fill="rgba(0,0,0,0.62)"/>
    <text x="8" y="23" font-family="Helvetica,Arial" font-size="18" font-weight="bold" fill="#fff">${e.index}</text>
    <text x="46" y="23" font-family="Helvetica,Arial" font-size="14" fill="#fff">${e.medium[0].toUpperCase()} · ${esc(e.city)}, ${esc(e.country)} · ${e.year}</text>
  </svg>`;

  return sharp(thumb)
    .composite([{ input: Buffer.from(label), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(TMP, { recursive: true });
  fs.mkdirSync(SHEETS, { recursive: true });
  const entries = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'manifest.json'), 'utf8')) as Entry[];

  const sheetCount = Math.ceil(entries.length / PER);
  for (let s = 0; s < sheetCount; s++) {
    const slice = entries.slice(s * PER, s * PER + PER);
    const composites: { input: Buffer; top: number; left: number }[] = [];
    for (let i = 0; i < slice.length; i++) {
      const buf = await thumbBuffer(slice[i]);
      composites.push({
        input: buf,
        top: Math.floor(i / COLS) * CH,
        left: (i % COLS) * CW,
      });
    }
    const out = path.join(SHEETS, `sheet-${String(s + 1).padStart(2, '0')}.png`);
    await sharp({
      create: { width: COLS * CW, height: ROWS * CH, channels: 3, background: '#ffffff' },
    })
      .composite(composites)
      .jpeg({ quality: 82 })
      .toFile(out.replace('.png', '.jpg'));
    process.stdout.write(`  ✓ sheet ${s + 1}/${sheetCount}  (indices ${slice[0].index}–${slice[slice.length - 1].index})\n`);
  }
  console.log(`\nWrote ${sheetCount} sheets to ${SHEETS}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
