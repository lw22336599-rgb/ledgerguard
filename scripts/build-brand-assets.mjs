import sharp from "sharp";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const sourceCandidates = [
  process.env.BRAND_LOGO_SRC,
  join(process.cwd(), "artifacts", "brand", "logo-source-bold-lg.png"),
  "C:/Users/lw223/Desktop/LedgerGuard-Logo-Options/lg-logo-01-bold-lg.png",
].filter((value): value is string => Boolean(value));
const src = sourceCandidates.find((candidate) => existsSync(candidate));
if (!src) {
  throw new Error(
    "Brand logo source not found. Add artifacts/brand/logo-source-bold-lg.png or set BRAND_LOGO_SRC.",
  );
}
const root = join(process.cwd(), "public");
const brandDir = join(root, "brand");

await mkdir(brandDir, { recursive: true });
await mkdir(join(process.cwd(), "artifacts", "brand"), { recursive: true });

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const width = info.width;
const height = info.height;
const channels = info.channels;

for (let index = 0; index < data.length; index += channels) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  if (red + green + blue < 90) {
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    if (channels === 4) data[index + 3] = 255;
  }
}

const cleaned = await sharp(data, {
  raw: { width, height, channels },
})
  .png()
  .toBuffer();

for (const size of [512, 192, 64, 32]) {
  await sharp(cleaned)
    .resize(size, size)
    .png()
    .toFile(join(brandDir, `logo-${size}.png`));
}

await sharp(cleaned).resize(512, 512).png().toFile(join(root, "favicon.png"));
await sharp(cleaned).resize(32, 32).png().toFile(join(root, "favicon.ico"));

const png512 = await sharp(cleaned).resize(512, 512).png().toBuffer();
const base64 = png512.toString("base64");
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="LedgerGuard"><image href="data:image/png;base64,${base64}" width="512" height="512"/></svg>`;
await writeFile(join(root, "favicon.svg"), faviconSvg, "utf8");
await writeFile(join(brandDir, "favicon.svg"), faviconSvg, "utf8");
await sharp(cleaned)
  .resize(512, 512)
  .png()
  .toFile(
    join(process.cwd(), "artifacts", "brand", "logo-selected-bold-lg.png"),
  );

console.log(
  JSON.stringify(
    {
      source: src,
      outputs: [
        "public/favicon.svg",
        "public/favicon.png",
        "public/favicon.ico",
        "public/brand/logo-512.png",
      ],
    },
    null,
    2,
  ),
);
