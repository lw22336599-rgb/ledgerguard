#!/usr/bin/env node
/**
 * Publish @ledgerguard1/sdk after auth and org checks.
 * Usage: node scripts/publish-sdk.mjs [--dry-run]
 */
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sdkRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "packages", "sdk");
const dryRun = process.argv.includes("--dry-run");

function run(command, options = {}) {
  const inherit = options.inherit ?? options.stdio === "inherit";
  const result = execSync(command, {
    cwd: sdkRoot,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    env: {
      ...process.env,
      ...(process.env.NPM_TOKEN
        ? { NODE_AUTH_TOKEN: process.env.NPM_TOKEN }
        : {}),
    },
    ...options,
  });
  if (inherit || result == null) return "";
  return String(result).trim();
}

function whoami() {
  try {
    return run("npm whoami");
  } catch {
    if (process.env.NPM_TOKEN) {
      console.log("Using NPM_TOKEN for publish (whoami skipped).");
      return "token-auth";
    }
    console.error(
      [
        "Not logged in to npm.",
        "Option A: npm login",
        "Option B: create a Granular Access Token on npmjs.com → set NPM_TOKEN env var",
        "Org @ledgerguard1 is ready (owner: ledgerguard).",
      ].join("\n"),
    );
    process.exit(1);
  }
}

const user = whoami();
console.log(`npm user: ${user}`);

try {
  run("npm org ls ledgerguard1");
  console.log("npm org @ledgerguard1: accessible");
} catch {
  console.warn(
    "Cannot list @ledgerguard1 org. Confirm you are logged in as org owner ledgerguard.",
  );
}

run("npm run test:pack-install", { stdio: "inherit" });

if (dryRun) {
  run("npm publish --dry-run", { stdio: "inherit" });
  console.log("Dry run complete. Remove --dry-run to publish.");
} else {
  run("npm publish --access public", { stdio: "inherit" });
  console.log("Published @ledgerguard1/sdk");
}
