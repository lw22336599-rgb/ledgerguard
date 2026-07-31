#!/usr/bin/env node
/**
 * Publish @ledgerguard/sdk after auth and org checks.
 * Usage: node scripts/publish-sdk.mjs [--dry-run]
 */
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sdkRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "sdk");
const dryRun = process.argv.includes("--dry-run");

function run(command, options = {}) {
  return execSync(command, {
    cwd: sdkRoot,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
    ...options,
  }).trim();
}

function whoami() {
  try {
    return run("npm whoami");
  } catch {
    console.error(
      "Not logged in to npm. Run: npm login\nThen create org: https://www.npmjs.com/org/create (name: ledgerguard)",
    );
    process.exit(1);
  }
}

const user = whoami();
console.log(`npm user: ${user}`);

try {
  run("npm org ls ledgerguard");
  console.log("npm org @ledgerguard: accessible");
} catch {
  console.warn(
    "Cannot list @ledgerguard org. Create it at https://www.npmjs.com/org/create if this is the first publish.",
  );
}

run("npm run test:pack-install", { stdio: "inherit" });

if (dryRun) {
  run("npm publish --dry-run", { stdio: "inherit" });
  console.log("Dry run complete. Remove --dry-run to publish.");
} else {
  run("npm publish --access public", { stdio: "inherit" });
  console.log("Published @ledgerguard/sdk");
}
