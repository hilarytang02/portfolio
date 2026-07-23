import photosData from '@/data/photos.json';
import type { Photo, Tone, Continent, Category } from '@/types/photo';
import { CAMERA_KEYS, type CameraKey } from '@/data/cameras';

const ALL_PHOTOS = photosData as unknown as Photo[];

function orientation(p: Photo): 'L' | 'P' {
  return p.width >= p.height ? 'L' : 'P';
}
const loc = (p: Photo) => `${p.location.country}/${p.location.city}`;

/** Photos without extracted tone data sort as neutral mid-grey. */
const FALLBACK_TONE: Tone = { l: 60, a: 0, b: 0 };
const toneOf = (p: Photo): Tone => p.tone ?? FALLBACK_TONE;

/**
 * Perceptual distance between two photos' mean tones (weighted ΔLab).
 * Lightness carries double weight: a light→dark jump between neighbours reads
 * far harsher than an equal-sized hue shift, and "smooth" is mostly about
 * value, not hue.
 */
function toneDist(p: Photo, q: Photo): number {
  const s = toneOf(p);
  const t = toneOf(q);
  return Math.sqrt(2 * (s.l - t.l) ** 2 + (s.a - t.a) ** 2 + (s.b - t.b) ** 2);
}

/** Same place inside this many recent slots is penalized (keeps trips scattered). */
const LOC_WINDOW = 7;
/** Penalty at distance 1 (direct neighbour) — dwarfs typical tone distances. */
const LOC_PENALTY = 90;
/** Cost per extra photo in a same-orientation run (vertical stacks of talls/wides). */
const RUN_PENALTY = 12;
/**
 * Bonus (cost reduction) scaled by a location's share of the remaining pool.
 * Without it the greedy walk defers the biggest trip until only it is left,
 * then dumps it in a clump at the bottom; this keeps big buckets flowing out
 * at their natural rate. Self-correcting: neglect a bucket and its share — and
 * so its pull — grows.
 */
const PRESSURE_GAIN = 60;

/**
 * The first viewport shows the *tops of the masonry columns* — array slots
 * near 0, N/4, N/2, 3N/4 (4 columns on desktop; 0 and N/2 also cover
 * mobile's 2). The top SEED_DEPTH slots of each column form the "seed zone":
 * featured candidates get a discount there, so the opening rows lead with the
 * strongest work — but only when one fits the drift, never by teleporting a
 * tonal outlier in.
 */
const SEED_COLS = 4;
const SEED_DEPTH = 4;
const FEATURED_BONUS = 30;
/** Two seed slots sharing a location sit visually side by side — penalize. */
const SEED_LOC_PENALTY = 45;

/**
 * Reshuffle knob: a per-photo jitter (hash of SHUFFLE_SEED + id, a few tone
 * units at most) is added to every candidate's cost, deciding near-ties
 * differently per seed. Bump the seed for a fresh-but-equally-smooth
 * arrangement; the order stays fully deterministic for a given value.
 */
const SHUFFLE_SEED = 5;
const JITTER_SCALE = 4;
function jitter(id: string): number {
  let h = 2166136261;
  for (const ch of `${SHUFFLE_SEED}:${id}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967296) * JITTER_SCALE;
}

/**
 * Grid order: a deterministic greedy walk through tone space. Starting from
 * the lightest photo (the page opens airy), each step picks the unplaced photo
 * closest in tone to the last one — so color drifts gradually down each
 * masonry column instead of jumping — nudged by two soft costs:
 *
 *  - location: a photo from a place seen in the last LOC_WINDOW slots pays a
 *    penalty that decays with distance, so trips stay scattered through the
 *    grid (the old spread() guarantee, now expressed as a cost);
 *  - rhythm: extending a run of same-orientation photos costs RUN_PENALTY per
 *    extra, so portraits and landscapes keep alternating;
 *  - curation: inside the seed zone (the column-top slots the first viewport
 *    shows) featured photos get a discount, so the opening leads with the
 *    strongest work while staying on the drift.
 *
 * Ties break by id; there is no randomness, so the order is stable across
 * builds. A final repair pass hard-guarantees no same-place direct neighbours
 * (the greedy tail can run out of alternatives).
 */
export function orderPhotos(photos: Photo[]): Photo[] {
  if (photos.length <= 2) return [...photos].sort((a, b) => a.id.localeCompare(b.id));

  // Deterministic pool; the lightest *featured* photo (tie → id, nudged by
  // the shuffle jitter) starts the walk — slot 0 is the top-left of the grid,
  // the single most-seen tile.
  const pool = [...photos].sort((a, b) => a.id.localeCompare(b.id));
  const startScore = (p: Photo) => toneOf(p).l + jitter(p.id) * 2;
  let startIdx = 0;
  const anyFeatured = pool.some((p) => p.featured);
  for (let i = 1; i < pool.length; i++) {
    const better =
      anyFeatured && pool[i].featured !== pool[startIdx].featured
        ? pool[i].featured
        : startScore(pool[i]) > startScore(pool[startIdx]);
    if (better) startIdx = i;
  }
  const out: Photo[] = [pool[startIdx]];
  pool.splice(startIdx, 1);

  const N = photos.length;
  const T = Math.floor(N / SEED_COLS);
  const inSeedZone = (s: number) => s % T < SEED_DEPTH && Math.floor(s / T) < SEED_COLS;
  const seedLocs = new Set<string>();
  if (inSeedZone(0)) seedLocs.add(loc(out[0]));

  // Remaining photos per location, kept current as the pool drains.
  const remaining = new Map<string, number>();
  for (const p of [out[0], ...pool]) remaining.set(loc(p), (remaining.get(loc(p)) ?? 0) + 1);
  remaining.set(loc(out[0]), remaining.get(loc(out[0]))! - 1);

  let runLen = 1; // length of the same-orientation run at the tail
  while (pool.length > 0) {
    const last = out[out.length - 1];
    let bestIdx = 0;
    let bestCost = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i];
      let cost = toneDist(last, c);
      // Nearest recent occurrence of this photo's location, if any.
      for (let d = 1; d <= Math.min(LOC_WINDOW, out.length); d++) {
        if (loc(out[out.length - d]) === loc(c)) {
          cost += (LOC_PENALTY * (LOC_WINDOW - d + 1)) / LOC_WINDOW;
          break;
        }
      }
      if (orientation(c) === orientation(last)) cost += RUN_PENALTY * runLen;
      cost -= (PRESSURE_GAIN * remaining.get(loc(c))!) / pool.length;
      if (inSeedZone(out.length)) {
        if (c.featured) cost -= FEATURED_BONUS;
        if (seedLocs.has(loc(c))) cost += SEED_LOC_PENALTY;
      }
      cost += jitter(c.id);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }
    const picked = pool[bestIdx];
    if (inSeedZone(out.length)) seedLocs.add(loc(picked));
    runLen = orientation(picked) === orientation(out[out.length - 1]) ? runLen + 1 : 1;
    remaining.set(loc(picked), remaining.get(loc(picked))! - 1);
    out.push(picked);
    pool.splice(bestIdx, 1);
  }

  // Repair: swap away any same-place direct neighbours the endgame left
  // behind. The partner slot is searched *outward from the clash* so a fix
  // stays a local nudge — never a teleport that would tear the tonal drift.
  const okAt = (k: number, p: Photo) =>
    (k === 0 || loc(out[k - 1]) !== loc(p)) &&
    (k === out.length - 1 || loc(out[k + 1]) !== loc(p));
  for (let i = 1; i < out.length; i++) {
    if (loc(out[i]) !== loc(out[i - 1])) continue;
    search: for (let d = 2; d < out.length; d++) {
      for (const j of [i - d, i + d]) {
        if (j < 0 || j >= out.length) continue;
        if (okAt(j, out[i]) && okAt(i, out[j])) {
          [out[i], out[j]] = [out[j], out[i]];
          break search;
        }
      }
    }
  }

  return out;
}

/** All photos, ordered. The single source the grid renders from. */
let ORDERED: Photo[] | null = null;
export function getPhotos(): Photo[] {
  return (ORDERED ??= orderPhotos(ALL_PHOTOS));
}

/** Aggregate stats for the hero scope line (unique countries + year range). */
export function getPhotoStats(): { countries: number; minYear: number; maxYear: number } {
  const countries = new Set(ALL_PHOTOS.map((p) => p.location.country)).size;
  const years = ALL_PHOTOS.map((p) => p.year);
  return { countries, minYear: Math.min(...years), maxYear: Math.max(...years) };
}

/** Alt text (PRD §8): the title when present, otherwise generated from metadata. */
export function altText(photo: Photo): string {
  if (photo.title) return photo.title;
  const { city, country } = photo.location;
  return `${photo.category} photograph taken in ${city}, ${country}, ${photo.year}`;
}

export interface FilterOptions {
  continents: Continent[];
  /** Countries grouped under the continent they appear in. */
  countriesByContinent: Record<string, string[]>;
  categories: Category[];
  cameras: CameraKey[];
  filmStocks: string[];
}

/**
 * Derive every filter option from the data itself (PRD §5.2), so an empty
 * option can never render. Options are sorted for stable, predictable UI.
 */
export function deriveFilterOptions(photos: Photo[]): FilterOptions {
  const continents = new Set<Continent>();
  const countriesByContinent: Record<string, Set<string>> = {};
  const categories = new Set<Category>();
  const cameras = new Set<string>();
  const filmStocks = new Set<string>();

  for (const p of photos) {
    continents.add(p.location.continent);
    (countriesByContinent[p.location.continent] ??= new Set()).add(
      p.location.country,
    );
    categories.add(p.category);
    cameras.add(p.medium.camera);
    if (p.medium.filmStock) filmStocks.add(p.medium.filmStock);
  }

  return {
    continents: [...continents].sort((a, b) => a.localeCompare(b)),
    countriesByContinent: Object.fromEntries(
      Object.entries(countriesByContinent).map(([k, v]) => [
        k,
        [...v].sort((a, b) => a.localeCompare(b)),
      ]),
    ),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    // Preserve the canonical CAMERAS declaration order, filtered to those present.
    cameras: CAMERA_KEYS.filter((k) => cameras.has(k)),
    filmStocks: [...filmStocks].sort((a, b) => a.localeCompare(b)),
  };
}
