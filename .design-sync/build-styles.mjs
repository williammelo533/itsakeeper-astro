// Builds the two inputs the design-sync converter needs from this Astro repo.
//
// This repo is a static Astro site, not a React component package: there is no
// compiled component entry to bundle and no single stylesheet to point
// cfg.cssEntry at. So we synthesise both:
//
//   .design-sync/.cache/ds-styles.css  ← the site's CSS, concatenated in the
//     exact order the browser sees it (Base.astro loads styles.css then
//     palette.css globally; page components add theirs after). Font url()s are
//     rewritten from the site-absolute "/fonts/…" to a path relative to this
//     file so the converter's extractFonts can resolve and copy the woff2s.
//
//   .design-sync/.cache/ds-entry.mjs   ← an empty module. The converter needs
//     an --entry to locate the package root; with no exports it emits an
//     empty-bodied _ds_bundle.js and takes its tokens-only path.
//
// Re-run this before package-build.mjs (it is cfg.buildCmd).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const CACHE = join(HERE, '.cache');

// Cascade order, matching the running site:
//   Base.astro       → styles.css, palette.css   (every page)
//   page components  → about-page / content-page / journal  (layered after)
const SHEETS = [
  'src/styles/styles.css',
  'src/styles/palette.css',
  'src/styles/about-page.css',
  'src/styles/content-page.css',
  'src/styles/journal.css',
];

// From .design-sync/.cache/ up to the repo root, then into public/.
const FONT_PREFIX = '../../public/fonts/';

mkdirSync(CACHE, { recursive: true });

const parts = [];
for (const rel of SHEETS) {
  const css = readFileSync(join(REPO, rel), 'utf8')
    .replace(/url\(\s*(['"]?)\/fonts\//g, (_m, q) => `url(${q}${FONT_PREFIX}`);
  parts.push(`/* ── ${rel} ───────────────────────────────────────────── */\n${css}`);
}

writeFileSync(join(CACHE, 'ds-styles.css'), parts.join('\n\n'));
writeFileSync(join(CACHE, 'ds-entry.mjs'), 'export {};\n');

console.error(`ds-styles.css: ${SHEETS.length} sheets, ${(parts.join('').length / 1024).toFixed(0)} KB`);
