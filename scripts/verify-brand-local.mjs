/**
 * Verify brand assets locally: file outputs + HTTP responses from a running server.
 * Usage:
 *   npm run build:brand
 *   npm start   (separate terminal)
 *   npm run verify:brand
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const baseUrl = process.env.LEDGERGUARD_URL ?? "http://127.0.0.1:3000";
const sourcePath = join(root, "artifacts", "brand", "logo-source-bold-lg.png");
const faviconPngPath = join(root, "public", "favicon.png");
const faviconSvgPath = join(root, "public", "favicon.svg");

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);
}

const checks = [];

function pass(name, detail) {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

for (const path of [sourcePath, faviconPngPath, faviconSvgPath]) {
  if (!statSync(path).isFile()) {
    fail(`file:${path}`, "missing");
  }
}

const pngSize = statSync(faviconPngPath).size;
const svgText = readFileSync(faviconSvgPath, "utf8");

if (pngSize > 50_000) pass("favicon.png size", `${Math.round(pngSize / 1024)}KB`);
else fail("favicon.png size", `${pngSize} bytes — too small, likely wrong asset`);

if (svgText.includes("data:image/png;base64,") && svgText.includes('viewBox="0 0 512 512"')) {
  pass("favicon.svg", "embeds 512px PNG (matches selected logo)");
} else if (svgText.includes('viewBox="0 0 64 64"')) {
  fail("favicon.svg", "still the old hand-drawn 64px SVG");
} else {
  fail("favicon.svg", "unexpected SVG format");
}

try {
  const pngRes = await fetch(`${baseUrl}/favicon.png?v=4`);
  const pngType = pngRes.headers.get("content-type") ?? "";
  const pngBytes = Buffer.from(await pngRes.arrayBuffer());

  if (pngRes.ok && pngType.includes("image/png") && pngBytes.length > 50_000) {
    pass("HTTP /favicon.png", `${pngType}, ${Math.round(pngBytes.length / 1024)}KB`);
  } else if (pngType.includes("svg")) {
    fail("HTTP /favicon.png", "returns SVG — old server code or wrong route");
  } else {
    fail("HTTP /favicon.png", `${pngRes.status} ${pngType} ${pngBytes.length} bytes`);
  }

  const homeRes = await fetch(`${baseUrl}/`);
  const homeHtml = await homeRes.text();
  if (homeHtml.includes('src="/favicon.png?v=4"')) {
    pass("HTTP / nav logo", 'uses /favicon.png?v=4 in brand-mark');
  } else {
    fail("HTTP / nav logo", "brand-mark not pointing at favicon.png?v=4");
  }

  if (homeHtml.includes('href="/favicon.png?v=4"')) {
    pass("HTTP / tab icon", "page head links favicon.png?v=4");
  } else {
    fail("HTTP / tab icon", "missing favicon.png link in page head");
  }

  if (homeHtml.includes('href="/favicon.ico?v=4"')) {
    pass("HTTP / shortcut icon", "page head links favicon.ico?v=4");
  } else {
    fail("HTTP / shortcut icon", "missing favicon.ico shortcut link");
  }
} catch (error) {
  fail("HTTP server", `Cannot reach ${baseUrl} — run npm start first (${error})`);
}

const failed = checks.filter((check) => !check.ok);
console.log(
  JSON.stringify(
    {
      baseUrl,
      source: { path: sourcePath, sha256: sha256(sourcePath) },
      faviconPng: { path: faviconPngPath, sha256: sha256(faviconPngPath), bytes: pngSize },
      checks,
      result: failed.length === 0 ? "PASS" : "FAIL",
      preview: `${baseUrl}/favicon.png?v=4`,
    },
    null,
    2,
  ),
);

process.exit(failed.length === 0 ? 0 : 1);
