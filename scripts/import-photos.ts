/**
 * Bulk import (PRD §3.3): runs the add-photo pipeline over every image in a
 * directory, prompting for metadata per file. Used for the initial ~100-photo
 * load. `--dry-run` walks the prompts without writing anything.
 *
 *   npm run import-photos -- ./folder
 *   npm run import-photos -- ./folder --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { cleanPath, promptMetadata, addPhoto } from './photo-cli';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const dirArg = args.find((a) => !a.startsWith('--'));

  if (!dirArg) {
    console.error('Usage: npm run import-photos -- ./folder [--dry-run]');
    process.exit(1);
  }

  const dir = cleanPath(dirArg);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`Not a directory: "${dir}"`);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(dir, f));

  if (files.length === 0) {
    console.log(`No images found in ${dir}.`);
    return;
  }

  console.log(
    `Found ${files.length} image(s) in ${dir}${dryRun ? '  [DRY RUN — nothing will be written]' : ''}\n`,
  );

  const addedIds: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\n── (${i + 1}/${files.length}) ${path.basename(file)} ──`);

    const include = await confirm({ message: 'Import this file?', default: true });
    if (!include) {
      console.log('  Skipped.');
      continue;
    }

    const spec = await promptMetadata(file);
    const id = await addPhoto(spec, { dryRun });
    addedIds.push(id);
  }

  console.log(`\n✓ ${dryRun ? 'Would import' : 'Imported'} ${addedIds.length} photo(s).`);
  if (!dryRun && addedIds.length > 0) {
    console.log('\nNext steps:');
    console.log('  git add public/photos/ data/photos.json');
    console.log(`  git commit -m "Import ${addedIds.length} photos"`);
    console.log('  git push\n');
  }
}

main().catch((err) => {
  if (err?.name === 'ExitPromptError') {
    console.log('\nCancelled.');
    process.exit(0);
  }
  console.error(`\n✗ ${err?.message ?? err}`);
  process.exit(1);
});
