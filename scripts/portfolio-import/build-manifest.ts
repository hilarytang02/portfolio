/**
 * One-off migration: builds an ordered manifest of every source photo in
 * `/Volumes/JAN 2025/portfolio`, deriving medium / year / city / country /
 * continent / camera / film stock from the folder structure (digital + film)
 * and a hardcoded EXIF-GPS table (phone). Category is NOT set here — it's
 * classified separately from contact sheets and merged at import time.
 *
 * Writes the manifest + a human-readable report to the scratchpad. Touches
 * nothing in the app.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = '/Volumes/JAN 2025/portfolio';
const OUT_DIR = process.env.OUT_DIR || '/tmp/portfolio-import';

// ---- maps ------------------------------------------------------------------

const FILM_CAMERA = 'nikon-lite-touch-100w';
const DIGITAL_CAMERA = 'nikon-coolpix-s33';

// Phone: keyed by exact filename (two IMG_6489 differ by extension). Camera +
// year from EXIF; city/country reverse-geocoded from GPS (to confirm).
const PHONE: Record<string, { camera: string; year: number; city: string; country: string }> = {
  'IMG_5193.HEIC': { camera: 'iphone-11', year: 2024, city: 'Buenos Aires', country: 'Argentina' },
  'IMG_8489.heic': { camera: 'iphone-15', year: 2025, city: 'Rio de Janeiro', country: 'Brazil' },
  'IMG_8352.heic': { camera: 'iphone-15', year: 2025, city: 'Rio de Janeiro', country: 'Brazil' },
  'IMG_6489.HEIF': { camera: 'iphone-11-pro', year: 2024, city: 'Torres del Paine', country: 'Chile' },
  'IMG_5534.HEIC': { camera: 'iphone-15', year: 2025, city: 'Taipei', country: 'Taiwan' },
  'IMG_9262.HEIC': { camera: 'iphone-15', year: 2025, city: 'Buenos Aires', country: 'Argentina' },
  'IMG_1583.HEIC': { camera: 'iphone-15', year: 2025, city: 'Malibu', country: 'United States' },
  'IMG_1281.HEIC': { camera: 'iphone-15', year: 2026, city: 'Uttarakhand', country: 'India' },
  'IMG_9097.HEIC': { camera: 'iphone-15', year: 2025, city: 'Buenos Aires', country: 'Argentina' },
  'IMG_6489.heic': { camera: 'iphone-11', year: 2024, city: 'Mendoza', country: 'Argentina' },
  'IMG_1321.HEIC': { camera: 'iphone-15', year: 2026, city: 'Uttarakhand', country: 'India' },
  'IMG_9265.HEIC': { camera: 'iphone-15', year: 2025, city: 'Buenos Aires', country: 'Argentina' },
};

// Normalize the messy film-stock folder tokens → clean display names (fixes the
// "woflen" typo and the casing dupes that would otherwise split the filter).
const STOCK: Record<string, string> = {
  'silberra color 50': 'Silberra Color 50',
  kodakgold200: 'Kodak Gold 200',
  '400d daylight ei 400': 'Cinestill 400D',
  lomochrome: 'LomoChrome Metropolis 100-400',
  fujicolor100: 'Fujicolor 100',
  aeronega100: 'Aeronega 100',
  'orwo wolfen nc500': 'ORWO Wolfen NC500',
  'orwo woflen nc500': 'ORWO Wolfen NC500',
  'kodak vision3 500t': 'Kodak Vision3 500T',
  shanghai400: 'Shanghai GP3 400',
};

const CONTINENT: Record<string, string> = {
  'united states': 'North America',
  argentina: 'South America',
  brazil: 'South America',
  chile: 'South America',
  colombia: 'South America',
  peru: 'South America',
  malaysia: 'Asia',
  indonesia: 'Asia',
  philippines: 'Asia',
  taiwan: 'Asia',
  'hong kong': 'Asia',
  india: 'Asia',
  vietnam: 'Asia',
  turkey: 'Asia', // Izmir is in Anatolia — confirm if you'd rather it read Europe
  italy: 'Europe',
  france: 'Europe',
  germany: 'Europe',
  finland: 'Europe',
  poland: 'Europe',
  'czech republic': 'Europe',
  estonia: 'Europe',
  lithuania: 'Europe',
  morocco: 'Africa',
};

// ---- helpers ---------------------------------------------------------------

const IMG_EXT = new Set(['.jpg', '.jpeg', '.heic', '.heif']);

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}
function titleCase(s: string): string {
  // Capitalize the first letter of each space-separated word only, so accented
  // letters mid-word aren't mangled (e.g. "aït zineb" → "Aït Zineb").
  return s
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}
function walkImages(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('._') || e.name === '.DS_Store') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkImages(p));
    else if (IMG_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

interface Entry {
  index: number;
  source: string;
  base: string;
  medium: 'digital' | 'film' | 'phone';
  city: string;
  country: string;
  continent: string;
  year: number;
  camera: string;
  filmStock?: string;
  id: string;
}

const warnings: string[] = [];
const usedIds = new Set<string>();
// Same image filename appearing in two folders = an accidental copy; keep the
// first, skip the rest (a photo must not appear twice on the site).
const seenBases = new Map<string, string>(); // base -> "city (folder)" kept

function makeId(city: string, year: number): string {
  const b = `${slugify(city) || 'photo'}-${year}`;
  let id = b;
  let n = 2;
  while (usedIds.has(id)) id = `${b}-${n++}`;
  usedIds.add(id);
  return id;
}

function continentFor(country: string): string {
  const c = CONTINENT[country.toLowerCase()];
  if (!c) warnings.push(`No continent mapping for country "${country}"`);
  return c ?? 'Unknown';
}

// ---- parse -----------------------------------------------------------------

const entries: Entry[] = [];

// digital + film share year-city-country[-stock] folder naming.
function parseFolder(medium: 'digital' | 'film', rel: string, source: string) {
  const folder = rel.split(path.sep)[0]; // first-level subfolder under the medium
  if (!folder || folder.endsWith('.jpg') || folder.endsWith('.jpeg')) {
    warnings.push(`${medium}: loose file with no location folder → skipped: ${path.basename(source)}`);
    return;
  }
  const parts = folder.split('-').map((p) => p.trim());
  const year = Number(parts[0]);
  if (!year) {
    warnings.push(`${medium}: cannot parse year from folder "${folder}" → skipped`);
    return;
  }

  let city: string, country: string, filmStock: string | undefined;

  if (medium === 'film') {
    const stockRaw = parts[parts.length - 1];
    filmStock = STOCK[stockRaw.toLowerCase()];
    if (!filmStock) {
      warnings.push(`film: unknown stock "${stockRaw}" (folder "${folder}") → using title-case`);
      filmStock = titleCase(stockRaw);
    }
    if (parts.length >= 4) {
      city = titleCase(parts[1]);
      country = titleCase(parts[2]);
    } else {
      // 3-field: year-place-stock (no city). Region used as location.
      city = titleCase(parts[1]);
      country = titleCase(parts[1]);
      warnings.push(`film: no city in "${folder}" → using region "${city}" as city+country`);
    }
  } else {
    if (parts.length >= 3) {
      city = titleCase(parts[1]);
      country = titleCase(parts.slice(2).join('-'));
    } else {
      city = titleCase(parts[1]);
      country = titleCase(parts[1]);
      warnings.push(`digital: no country in "${folder}" → using "${city}" as city+country`);
    }
  }

  const base = path.basename(source);
  if (seenBases.has(base)) {
    warnings.push(`duplicate image "${base}": kept ${seenBases.get(base)}, skipped copy in "${folder}"`);
    return;
  }
  seenBases.set(base, `${city} (${folder})`);

  const index = entries.length;
  entries.push({
    index,
    source,
    base,
    medium,
    city,
    country,
    continent: continentFor(country),
    year,
    camera: medium === 'film' ? FILM_CAMERA : DIGITAL_CAMERA,
    filmStock,
    id: makeId(city, year),
  });
}

for (const medium of ['digital', 'film'] as const) {
  const root = path.join(SRC, medium);
  for (const img of walkImages(root)) {
    parseFolder(medium, path.relative(root, img), img);
  }
}

// phone
for (const img of walkImages(path.join(SRC, 'phone'))) {
  const base = path.basename(img);
  const meta = PHONE[base];
  if (!meta) {
    warnings.push(`phone: no geo entry for "${base}" → skipped`);
    continue;
  }
  const index = entries.length;
  entries.push({
    index,
    source: img,
    base,
    medium: 'phone',
    city: meta.city,
    country: meta.country,
    continent: continentFor(meta.country),
    year: meta.year,
    camera: meta.camera,
    id: makeId(meta.city, meta.year),
  });
}

// ---- output ----------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(entries, null, 2));

const byMedium = (m: string) => entries.filter((e) => e.medium === m).length;
console.log(`\nManifest: ${entries.length} photos  (digital ${byMedium('digital')}, film ${byMedium('film')}, phone ${byMedium('phone')})`);

console.log('\nUnique film stocks:');
console.log('  ' + [...new Set(entries.filter((e) => e.filmStock).map((e) => e.filmStock))].sort().join('\n  '));

console.log('\nUnique countries → continent:');
const cc = new Map<string, string>();
for (const e of entries) cc.set(e.country, e.continent);
console.log('  ' + [...cc].sort().map(([k, v]) => `${k} → ${v}`).join('\n  '));

console.log(`\nWarnings (${warnings.length}):`);
for (const w of warnings) console.log('  - ' + w);
console.log(`\nWrote ${path.join(OUT_DIR, 'manifest.json')}`);
