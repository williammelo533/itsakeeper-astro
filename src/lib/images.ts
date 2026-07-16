import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

export interface ImageMeta {
  width?: number;
  height?: number;
  /** Path to a same-name .webp twin, when one exists in /public. */
  webp?: string;
  /** Optional hand-optimized variants for responsive hero/banner delivery. */
  mobileWebp?: string;
  desktopWebp?: string;
  desktopAvif?: string;
  /** Width-keyed WebP variants generated before each production build. */
  responsiveWebp?: Array<{ path: string; width: number }>;
}

const cache = new Map<string, ImageMeta>();

/**
 * Measures a /public image at build time so <img> always carries its true
 * intrinsic width/height (keeps CLS at 0 even when the client swaps photos),
 * and detects a hand-optimized .webp twin so the original <picture> markup
 * is reproduced exactly.
 */
export function imageMeta(src: string): ImageMeta {
  const clean = (src || "").split(/[?#]/)[0];
  if (!clean) return {};
  const hit = cache.get(clean);
  if (hit) return hit;

  const publicDir = path.join(process.cwd(), "public");
  const meta: ImageMeta = {};

  try {
    const dims = imageSize(fs.readFileSync(path.join(publicDir, clean)));
    meta.width = dims.width;
    meta.height = dims.height;
  } catch {
    /* Missing file: emit the img without dimensions rather than fail the build. */
  }

  const webpTwin = clean.replace(/\.(jpe?g|png)$/i, ".webp");
  if (webpTwin !== clean && fs.existsSync(path.join(publicDir, webpTwin))) {
    meta.webp = webpTwin;
  }

  const webpBase = clean.replace(/\.(?:jpe?g|png|webp)$/i, "");
  const mobileWebp = `${webpBase}-mobile.webp`;
  const desktopWebp = `${webpBase}-desktop.webp`;
  const desktopAvif = `${webpBase}-desktop.avif`;
  if (fs.existsSync(path.join(publicDir, mobileWebp))) {
    meta.mobileWebp = mobileWebp;
  }
  if (fs.existsSync(path.join(publicDir, desktopWebp))) {
    meta.desktopWebp = desktopWebp;
  }
  if (fs.existsSync(path.join(publicDir, desktopAvif))) {
    meta.desktopAvif = desktopAvif;
  }

  meta.responsiveWebp = [400, 640, 960, 1440]
    .map((width) => ({
      path: `${webpBase}-${width}.webp`,
      width,
    }))
    .filter((variant) => fs.existsSync(path.join(publicDir, variant.path)));

  cache.set(clean, meta);
  return meta;
}
