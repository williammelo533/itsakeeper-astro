import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const widths = [400, 640, 960, 1440];
const sourcePattern = /\.(?:jpe?g|png|webp)$/i;
const generatedPattern = /-(?:400|640|960|1440|mobile|desktop)\.webp$/i;

const files = await fs.readdir(uploadsDir);
const sourceFiles = files.filter(
  (file) => sourcePattern.test(file) && !generatedPattern.test(file)
);

const byBase = new Map();
for (const file of sourceFiles) {
  const base = file.replace(/\.(?:jpe?g|png|webp)$/i, "");
  const current = byBase.get(base);
  if (!current || file.endsWith(".webp")) {
    byBase.set(base, file);
  }
}

let generated = 0;

for (const [base, file] of byBase) {
  const input = path.join(uploadsDir, file);
  const metadata = await sharp(input).metadata();
  if (!metadata.width) continue;

  for (const width of widths) {
    if (width > metadata.width) continue;

    const output = path.join(uploadsDir, `${base}-${width}.webp`);
    const [inputStat, outputStat] = await Promise.all([
      fs.stat(input),
      fs.stat(output).catch(() => null),
    ]);

    if (outputStat && outputStat.mtimeMs >= inputStat.mtimeMs) continue;

    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6, smartSubsample: true })
      .toFile(output);
    generated += 1;
  }
}

console.log(
  generated
    ? `Generated ${generated} responsive image variants.`
    : "Responsive image variants are up to date."
);
