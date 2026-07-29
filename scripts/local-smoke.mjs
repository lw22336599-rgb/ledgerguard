import { spawn } from "node:child_process";

const origin = "http://127.0.0.1:3097";
const server = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "--import", "tsx", "src/server.ts"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: "3097",
      PUBLIC_BASE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

async function waitUntilReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const response = await fetch(`${origin}/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The child process may still be starting.
    }
  }
  throw new Error(`Local server did not become ready.\n${serverOutput}`);
}

try {
  await waitUntilReady();
  const smoke = spawn(process.execPath, ["scripts/smoke.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, LEDGERGUARD_URL: origin },
    stdio: "inherit",
  });
  const exitCode = await new Promise((resolve, reject) => {
    smoke.once("error", reject);
    smoke.once("exit", resolve);
  });
  if (exitCode !== 0) process.exitCode = exitCode ?? 1;
} finally {
  server.kill();
}
