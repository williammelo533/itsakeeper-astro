export const STAGING_ORIGIN = "https://itsakeeperphotography.netlify.app";
export const RELEASE_ORIGIN = "https://www.itsakeeperphotography.com";

export type SiteMode = "staging" | "release";

const rawMode =
  import.meta.env.SITE_MODE ||
  import.meta.env.PUBLICATION_MODE ||
  process.env.SITE_MODE ||
  process.env.PUBLICATION_MODE ||
  "staging";

if (rawMode !== "staging" && rawMode !== "release") {
  throw new Error(`Unsupported SITE_MODE value: ${rawMode}`);
}

export const siteMode = rawMode as SiteMode;
export const siteOrigin = (
  import.meta.env.SITE_ORIGIN ||
  process.env.SITE_ORIGIN ||
  (siteMode === "release" ? RELEASE_ORIGIN : STAGING_ORIGIN)
).replace(/\/$/, "");

export const isRelease = siteMode === "release";

export const normalizePath = (path: string) => {
  if (!path || path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}/`;
};

export const absoluteUrl = (path: string) =>
  new URL(normalizePath(path), `${siteOrigin}/`).toString();

export const robotsDirective = (visibility: "index" | "noindex") =>
  isRelease && visibility === "index"
    ? "index, follow, max-image-preview:large"
    : "noindex, nofollow, noarchive";
