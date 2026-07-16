import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createBrotliCompress, createGzip } from "node:zlib";

const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4321);

const contentTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

const compressible = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".svg",
  ".txt",
  ".xml",
]);

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://local").pathname);
  const requested = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const relative = normalize(requested).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  let file = join(root, relative);

  if (!existsSync(file) || !statSync(file).isFile()) {
    file = join(root, "index.html");
  }

  const extension = extname(file).toLowerCase();
  const accepts = request.headers["accept-encoding"] || "";
  const shouldCompress = compressible.has(extension);
  const source = createReadStream(file);

  response.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
  response.setHeader("Cache-Control", extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable");
  response.setHeader("Vary", "Accept-Encoding");

  if (shouldCompress && accepts.includes("br")) {
    response.setHeader("Content-Encoding", "br");
    source.pipe(createBrotliCompress()).pipe(response);
  } else if (shouldCompress && accepts.includes("gzip")) {
    response.setHeader("Content-Encoding", "gzip");
    source.pipe(createGzip()).pipe(response);
  } else {
    source.pipe(response);
  }
}).listen(port, host, () => {
  console.log(`Static production preview: http://${host}:${port}`);
});
