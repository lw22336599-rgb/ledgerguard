import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sdkRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packOutput = execSync("npm pack --silent", {
  cwd: sdkRoot,
  encoding: "utf8",
}).trim();
const tarball = join(sdkRoot, packOutput);

const workdir = mkdtempSync(join(tmpdir(), "ledgerguard-sdk-pack-"));
writeFileSync(
  join(workdir, "package.json"),
  JSON.stringify({ name: "pack-smoke", private: true, type: "module" }, null, 2),
);

try {
  execSync(`npm install "${tarball}"`, { cwd: workdir, stdio: "inherit" });
  execSync(
    `node --input-type=module -e "import { LedgerGuardClient, withPreflight, preflightFetch } from '@ledgerguard/sdk'; if (typeof LedgerGuardClient !== 'function') throw new Error('missing client'); console.log('pack install smoke ok');"`,
    { cwd: workdir, stdio: "inherit" },
  );
} finally {
  rmSync(workdir, { recursive: true, force: true });
  rmSync(tarball, { force: true });
}
