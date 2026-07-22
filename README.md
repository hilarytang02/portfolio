# Photography Portfolio

A single-page photography portfolio — a light, VSCO-style responsive grid with
stacked filtering, a full-metadata lightbox, and hero contact links. Static site,
no CMS and no backend: photo metadata lives in a committed JSON file, and adding
a photo is a Git commit.

Built with Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.

---

## Site config

Name, quote, contact email, and social links live in one file:
[`data/site.ts`](data/site.ts). Email (`hello@hilarytang.com`) and Instagram
(`@untangled.hills`) are set and shown in the hero.

The one thing still outstanding: a **custom domain** — not in code; [add it in
Vercel](#deploying-to-vercel) once purchased. Until then the site runs on the
Vercel preview URL.

---

## Local development

Requires **Node 20+**.

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (runs the validator first, see below)
npm run start        # serve the production build
npm run lint         # ESLint
npm test             # unit tests for the filter logic (lib/filter.test.ts)
npm run validate-photos   # validate data/photos.json on demand
```

---

## Adding a photo

There are two equally valid ways to add a photo. The script is a convenience,
not a gate — hand-editing works just as well.

### Option A — the interactive script (recommended)

```bash
npm run add-photo
```

It will prompt you for:

1. **Source image path** — type it, or drag the file into the terminal
   (surrounding quotes/whitespace are stripped automatically).
2. **City, country, continent, year, medium type, camera, film stock (film
   only), category, featured, title.** Country and film stock autocomplete from
   values already in the library, and let you type a new one. When a medium type
   has only one matching camera, it's auto-selected.

The script then:

- derives a stable `id` from `city-year` (e.g. `lisboa-2024`), appending `-2`,
  `-3`… on collision;
- processes the image with `sharp` — resizes so the long edge is ≤ 2400px,
  converts to `.webp` at quality 82, writes `public/photos/{id}.webp`, and
  generates a blurred base64 `blurDataURL` placeholder;
- appends the entry to `data/photos.json` (schema key order, 2-space indent);
- prints the exact `git add` / `git commit` / `git push` lines to run.

**Non-interactive** (for scripting):

```bash
npm run add-photo -- \
  --file=~/Desktop/shot.jpg \
  --city=Lisboa --country=Portugal --continent=Europe \
  --type=film --camera=nikon-lite-touch-100w --film="Kodak Portra 400" \
  --category=city --year=2024 --featured --title="Alfama mornings"
```

`--year` defaults to the current year; `--featured` and `--title` are optional;
`--film` is required when `--type=film` and forbidden otherwise.

### Option B — by hand

1. Add (or drop in) a correctly-named image at `public/photos/{id}.webp`.
   Ideally pre-sized to a 2400px long edge and saved as `.webp`.
2. Add an object to `data/photos.json` following the schema in
   [`types/photo.ts`](types/photo.ts). `blurDataURL` is optional (the image just
   won't have a blur-up placeholder if omitted).
3. Run `npm run validate-photos` to confirm it's well-formed.

### Bulk import

For the initial load of many photos, point the importer at a folder. It runs the
same pipeline, prompting per file:

```bash
npm run import-photos -- ./folder-of-photos
npm run import-photos -- ./folder-of-photos --dry-run   # walk the prompts, write nothing
```

---

## Adding a new camera

Cameras are a **closed set** so the filter options stay clean. Add one line to
[`data/cameras.ts`](data/cameras.ts):

```ts
export const CAMERAS = {
  'nikon-coolpix-s33':     { label: 'Nikon Coolpix S33',          type: 'digital' },
  'nikon-lite-touch-100w': { label: 'Nikon Lite Touch Zoom 100W', type: 'film' },
  'iphone-15':             { label: 'iPhone 15',                  type: 'phone' },
  // add here — the key is what photos.json stores; the label is what renders:
  'canon-ae-1':            { label: 'Canon AE-1',                 type: 'film' },
} as const;
```

`photos.json` stores the **key**; the UI renders the **label**. `type` must be
one of `digital` | `film` | `phone`.

Film stocks, by contrast, are **open-ended** and derived from the data — the
film-stock filter simply lists the unique `medium.filmStock` values present in
`photos.json`. No list to maintain; just type the stock when adding a photo.

---

## What the validator checks

`npm run validate-photos` runs automatically before every build (`prebuild`), so
a bad `photos.json` fails the build. It reports every problem at once, each
tagged with the offending photo `id`.

| Error | Fix |
|---|---|
| `duplicate id "x"` | Give the photo a unique `id`. |
| `missing "filename"` / `file not found in /public/photos/: "x"` | Ensure `filename` is set and the file exists at `public/photos/{filename}`. |
| `missing or zero "width"` / `"height"` | Set the image's real pixel dimensions (the scripts fill these in for you). |
| `year N outside 1950–<current year>` | Correct the `year`. |
| `continent "x" is not a valid Continent` | Use one of: Asia, Europe, North America, South America, Africa, Oceania, Antarctica. |
| `category "x" is not a valid Category` | Use one of: `people`, `nature`, `city`. |
| `camera "x" is not in CAMERAS` | Use a key defined in `data/cameras.ts` (or add the camera there). |
| `camera "x" is a <type> camera but medium.type is "<type>"` | Make `medium.type` match the camera's declared type. |
| `medium.type is "film" but no filmStock given` | Add `medium.filmStock` for film photos. |
| `medium.type is "<t>" but a filmStock is set` | Remove `filmStock` from digital/phone photos. |

There's also a non-fatal **warning** for any file in `public/photos/` with no
entry in `photos.json` (an orphan file) — clean it up or add its entry.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. In the [Vercel dashboard](https://vercel.com/new), **Import** the repo. Vercel
   detects Next.js automatically — no configuration needed. Deploy.
3. You get a preview URL immediately (e.g. `your-project.vercel.app`). The site
   is fully static; `next/image` optimization works out of the box on Vercel.

**Custom domain** (once purchased): Project → **Settings → Domains → Add**, then
follow Vercel's DNS instructions. No code change is required — the site has no
hardcoded domain.

---

## Project structure

```
app/
  layout.tsx          # root layout, fonts, metadata
  page.tsx            # the only route (statically generated)
  globals.css         # design tokens + grid / hover CSS
  icon.svg            # favicon
components/
  Hero.tsx            # name, quote, scope line, contact (Instagram + email)
  Gallery.tsx         # client orchestrator: filter state, grid, lightbox
  FilterBar.tsx       # desktop filter bar
  FilterSheet.tsx     # mobile bottom-sheet filters
  FilterGroup.tsx     # shared facet (real checkboxes, counts, disabled states)
  PhotoGrid.tsx  PhotoTile.tsx  Lightbox.tsx
lib/
  photos.ts               # load, sort, derive filter options, alt text
  filter.ts               # pure predicate + faceted counts (unit-tested)
  filter.test.ts
  url-state.ts            # filter state <-> query string (slugified)
  useFilterQueryState.ts  # URL sync via useSyncExternalStore (keeps SSG)
data/
  photos.json         # the single source of truth
  cameras.ts          # closed camera vocabulary
  site.ts             # name, quote, contact — the placeholder values
types/photo.ts
scripts/
  add-photo.ts  import-photos.ts  validate-photos.ts
  photo-cli.ts            # shared prompting / append logic
  image-pipeline.ts       # sharp resize + webp + blurDataURL
  generate-placeholders.ts   # dev helper: regenerates the sample photos
public/photos/        # the .webp images
```

The sample photos are generated gradients. To regenerate them (or once you've
added real photos and want to drop the samples), see
`scripts/generate-placeholders.ts` — but for real work, just use
`add-photo` / `import-photos`.

---

## How filtering works (quick reference)

- **Four filter groups**: Location (continent → country, cascading), Category,
  Medium (camera), Film stock.
- Within a group selections are **OR**'d; across groups they're **AND**'d.
- Every option shows a live **count** given the other active filters; options
  that would yield zero are dimmed and disabled, so you can't reach a dead end.
- Filters serialize to the **URL** (`/?continent=europe&country=portugal`), so a
  filtered view is shareable and survives reload.
- The lightbox navigates within the **currently filtered** set.

All of it is derived from `photos.json` — there are no lists to keep in sync.
