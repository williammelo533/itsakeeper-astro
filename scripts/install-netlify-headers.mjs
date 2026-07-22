import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const mode = process.env.SITE_MODE || process.env.PUBLICATION_MODE || "staging";
if (!new Set(["staging", "release"]).has(mode)) {
  throw new Error(`SITE_MODE must be staging or release; received ${mode}.`);
}

const root = process.cwd();
const output = existsSync(path.join(root, "dist", "client"))
  ? path.join(root, "dist", "client")
  : path.join(root, "dist");
const source = path.join(root, "config", "netlify-headers", mode);
const destination = path.join(output, "_headers");

await mkdir(output, { recursive: true });
await copyFile(source, destination);
console.log(`Installed ${mode} Netlify headers at ${destination}.`);
