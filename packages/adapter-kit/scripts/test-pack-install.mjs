import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(join(tmpdir(), "ledgerguard-adapter-kit-"));
try {
  const filename = execSync("npm pack --silent", { cwd: packageRoot, encoding: "utf8" }).trim();
  writeFileSync(join(temp, "package.json"), '{"type":"module"}');
  execSync(`npm install --ignore-scripts "${join(packageRoot, filename)}"`, { cwd: temp, stdio: "pipe" });
  execSync('node --input-type=module -e "import {defineExtension,EXTENSION_CAPABILITIES} from \'@ledgerguard1/adapter-kit\'; if(typeof defineExtension!==\'function\'||EXTENSION_CAPABILITIES.length<1) process.exit(1)"', { cwd: temp, stdio: "pipe" });
  console.log("PASS adapter-kit packed install");
} finally {
  rmSync(temp, { recursive: true, force: true });
  for (const name of ["ledgerguard1-adapter-kit-0.1.0.tgz"]) {
    rmSync(join(packageRoot, name), { force: true });
  }
}
