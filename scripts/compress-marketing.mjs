import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const dir = join(process.cwd(), "public", "marketing");
const maxBytes = 100 * 1024;
const files = (await readdir(dir)).filter((name) => name.endsWith(".png"));

for (const name of files) {
  const input = join(dir, name);
  const before = (await stat(input)).size;
  let width = 1280;
  let buffer = await sharp(input).png().toBuffer();

  while (buffer.length > maxBytes && width >= 720) {
    buffer = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 72 })
      .toBuffer();
    if (buffer.length > maxBytes) width -= 80;
  }

  if (buffer.length > maxBytes) {
    buffer = await sharp(input)
      .resize({ width: 640, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 60 })
      .toBuffer();
  }

  await sharp(buffer).toFile(input);
  const after = (await stat(input)).size;
  console.log(`${name}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB (width~${width})`);
}
