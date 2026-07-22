import type { APIRoute } from "astro";
import { pageManifest } from "../lib/page-manifest";
import { isRelease, siteOrigin } from "../lib/site-environment";

export const prerender = true;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = () => {
  const entries = isRelease
    ? pageManifest.filter(
        (entry) =>
          entry.contentStatus === "ready" &&
          entry.searchVisibility === "index" &&
          entry.sitemap
      )
    : [];

  const urls = entries
    .map((entry) => `  <url><loc>${escapeXml(new URL(entry.path, `${siteOrigin}/`).toString())}</loc></url>`)
    .join("\n");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
