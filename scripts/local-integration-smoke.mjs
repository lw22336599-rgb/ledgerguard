import { spawn } from "node:child_process";

const origin = "http://127.0.0.1:3098";
const server = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "--import", "tsx", "src/server.ts"],
  {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3098", PUBLIC_BASE_URL: origin },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let output = "";
server.stdout.on("data", (chunk) => { output += chunk.toString(); });
server.stderr.on("data", (chunk) => { output += chunk.toString(); });

async function waitUntilReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The child process may still be starting.
    }
  }
  throw new Error(`Local integration server did not become ready.\n${output}`);
}

try {
  await waitUntilReady();
  const scenarios = spawn(process.execPath, ["examples/integrations/run-all-scenarios.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LEDGERGUARD_URL: origin,
      LEDGERGUARD_NETWORK: "arcTestnet",
    },
    stdio: "inherit",
  });
  const exitCode = await new Promise((resolve, reject) => {
    scenarios.once("error", reject);
    scenarios.once("exit", resolve);
  });
  if (exitCode !== 0) process.exitCode = exitCode ?? 1;
} finally {
  await new Promise((resolve) => {
    if (server.exitCode !== null) return resolve();
    const timer = setTimeout(resolve, 2_000);
    server.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    server.kill();
  });
  server.stdout.destroy();
  server.stderr.destroy();
}

process.exit(process.exitCode ?? 0);
