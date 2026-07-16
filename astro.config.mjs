// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import tina from "@tinacms/astro/integration";
import { tinaAdminDevRedirect } from "@tinacms/astro/vite";

const deployTarget =
  process.env.DEPLOY_TARGET ||
  (process.env.VERCEL ? "vercel" : process.env.NETLIFY ? "netlify" : "node");

const adapter =
  deployTarget === "vercel"
    ? vercel()
    : deployTarget === "netlify"
      ? netlify()
      : node({ mode: "standalone" });

export default defineConfig({
  site: "https://www.itsakeeperphotography.com",
  output: "static",
  adapter,
  integrations: [tina()],
  build: {
    inlineStylesheets: "always",
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tinaAdminDevRedirect()],
  },
});
