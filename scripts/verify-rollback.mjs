import { readFileSync } from "node:fs";

const commercial = readFileSync(new URL("../src/config/commercial.ts", import.meta.url), "utf8");
const networks = readFileSync(new URL("../src/config/networks.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.ts", import.meta.url), "utf8");

const checks = [
  ["mainnet charging requires an explicit enable flag", commercial.includes('BASE_MAINNET_X402_ENABLED')],
  ["Arc mainnet remains explicitly gated", networks.includes("arcMainnet") && networks.includes("enabled")],
  ["extension routes are additive and isolated", app.includes('/v1/extensions') && app.includes('extensions/registry.js')],
  ["readiness fails closed on registry integrity", app.includes('EXTENSION_REGISTRY_INVALID') || app.includes('getExtensionRegistryHealth')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length > 0) process.exitCode = 1;
