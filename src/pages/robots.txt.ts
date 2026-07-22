import type { APIRoute } from "astro";
import { isRelease, siteOrigin } from "../lib/site-environment";

export const prerender = true;

export const GET: APIRoute = () => {
  const lines = isRelease
    ? [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /tina-island/",
        "",
        `Sitemap: ${siteOrigin}/sitemap.xml`,
      ]
    : [
        "User-agent: *",
        "Allow: /",
        "",
        "# Staging is crawlable only so page-level noindex directives can be observed.",
      ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
