import type { APIRoute } from "astro";
import { pageManifest } from "../lib/page-manifest";
import { isRelease, siteOrigin } from "../lib/site-environment";

export const prerender = true;

export const GET: APIRoute = () => {
  if (!isRelease) {
    return new Response(
      "# It's A Keeper Photography — staging\n\n> This build is a noindex staging preview. It is not approved for citation.\n",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const entries = pageManifest.filter(
    (entry) =>
      entry.contentStatus === "ready" &&
      entry.searchVisibility === "index" &&
      entry.llms
  );
  const pages = entries
    .map((entry) => `- [${entry.title}](${new URL(entry.path, `${siteOrigin}/`).toString()}): ${entry.summary}`)
    .join("\n");

  const body = `# It's A Keeper Photography\n\n> Warm, natural portrait photography by Lisa Weiss in Richland, Kennewick and Pasco, Washington.\n\n## Approved pages\n\n${pages}\n\n## Contact\n\n- Photographer: Lisa Weiss\n- Service area: Richland, Kennewick and Pasco, Washington\n- Phone: (509) 948-7322\n- Email: itsakeeperphoto@gmail.com\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
