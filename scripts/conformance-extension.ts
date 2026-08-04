import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { runExtensionConformance } from "../src/extensions/conformance.js";

const requested = process.argv.slice(2);
const roots = requested.length > 0 ? requested : ["registry/extensions"];
const files: string[] = [];
for (const root of roots) {
  const absolute = resolve(root);
  if (!existsSync(absolute)) throw new Error(`Manifest path does not exist: ${root}`);
  if (statSync(absolute).isDirectory()) {
    files.push(
      ...readdirSync(absolute)
        .filter((name) => extname(name).toLowerCase() === ".json")
        .map((name) => join(absolute, name)),
    );
  } else {
    files.push(absolute);
  }
}

if (files.length === 0) throw new Error("No extension manifests found");
let failed = false;
for (const file of files.sort()) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const report = runExtensionConformance(manifest);
  const artifactPath = [manifest.source?.path, manifest.artifact?.path]
    .filter(Boolean)
    .join("/")
    .replaceAll("\\", "/");
  let artifactPinned = false;
  let artifactMessage = "Artifact could not be verified at the pinned source commit.";
  if (
    manifest.source?.repository === "https://github.com/lw22336599-rgb/ledgerguard" &&
    /^[0-9a-f]{40}$/.test(manifest.source?.commit ?? "") &&
    artifactPath
  ) {
    try {
      const content = execFileSync(
        "git",
        ["show", `${manifest.source.commit}:${artifactPath}`],
        { cwd: process.cwd() },
      );
      const actual = `sha256:${createHash("sha256").update(content).digest("hex")}`;
      artifactPinned = actual === manifest.artifact.digest;
      artifactMessage = artifactPinned
        ? "Artifact digest matches the pinned Git blob."
        : `Artifact digest mismatch: ${actual}`;
    } catch {
      artifactMessage = "Pinned artifact is not available in the local Git object database.";
    }
  }
  const checks = [
    ...report.checks,
    { id: "artifact.pinned-content", passed: artifactPinned, message: artifactMessage },
  ];
  const output = { ...report, passed: report.passed && artifactPinned, checks };
  console.log(JSON.stringify({ file, ...output }));
  failed ||= !output.passed;
}
if (failed) process.exitCode = 1;
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
