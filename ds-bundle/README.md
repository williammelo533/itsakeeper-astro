# ItsAKeeper (its-a-keeper-astro@0.0.1)

This design system is the published its-a-keeper-astro React library, bundled as a single
browser global. All 0 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.ItsAKeeper`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).
- `guidelines/` — the design system's own usage guidance (1 doc(s), see `guidelines/index.md`). Read these before composing larger layouts.

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.ItsAKeeper.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Component } = window.ItsAKeeper;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Component />);
```

## Tokens

439 CSS custom properties from its-a-keeper-astro. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (43): `--color-canvas`, `--color-header`, `--color-surface-sage`, …
- **spacing** (74): `--space-0`, `--space-1`, `--space-2`, …
- **typography** (39): `--font-display`, `--font-body`, `--font-utility`, …
- **radius** (5): `--radius-none`, `--radius-control`, `--radius-card`, …
- **shadow** (6): `--shadow-none`, `--shadow-header-scrolled`, `--shadow-page-preview`, …
- **other** (272): `--reference-header`, `--reference-sage`, `--reference-oatmeal`, …

## Components


