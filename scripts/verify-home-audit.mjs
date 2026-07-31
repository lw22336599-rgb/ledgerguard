const base = process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";

const paths = [
  "/",
  "/pay",
  "/payments",
  "/guard/create",
  "/testnet-help",
  "/docs",
  "/status",
  "/canary",
  "/protect",
  "/developer",
  "/meter",
  "/receipts",
  "/catalog",
  "/test",
  "/privacy",
  "/terms",
  "/about",
  "/routes",
];

function count(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

const homeRes = await fetch(`${base}/`);
const home = await homeRes.text();
const payJs = await fetch(`${base}/pay.js`);

console.log("=== DEPLOY ===");
console.log("home status", homeRes.status);
console.log("/pay status", (await fetch(`${base}/pay`)).status);
console.log("/payments status", (await fetch(`${base}/pay`)).status);
console.log("pay.js status", payJs.status);
console.log("pay.js has pay-form", (await payJs.text()).includes("pay-form"));

console.log("\n=== PAGE STATUS (sample) ===");
for (const path of paths) {
  const r = await fetch(`${base}${path}`);
  console.log(r.status, path);
}

console.log("\n=== HOME CONTENT ===");
const checks = [
  ["Send and receive USDC (title/meta)", /Send and receive USDC/i.test(home)],
  ["h1 simple link", /with a simple link/i.test(home)],
  ["Get paid text", /Get paid/.test(home)],
  ["Pay a link text", /Pay a link/.test(home)],
  ["No signup", /No signup/i.test(home)],
  ["#how-it-works", /id="how-it-works"/.test(home)],
  ["No wallet yet", /No wallet yet/.test(home)],
  ["Connect wallet step", />Connect wallet</.test(home)],
  ["Enter amount step", />Enter amount</.test(home)],
  ["Share the link step", />Share the link</.test(home)],
  ["Developers in footer", /footer-links[\s\S]*Developers/.test(home)],
  ["Base Mainnet mention", /Base Mainnet/.test(home)],
];

for (const [label, ok] of checks) {
  console.log(ok ? "OK" : "NO", label);
}

console.log("\n=== LINK COUNTS (homepage HTML only) ===");
const links = [
  ["/guard/create", /href="\/guard\/create"/g],
  ["/pay", /href="\/pay"/g],
  ["/docs", /href="\/docs"/g],
  ["/status", /href="\/status"/g],
  ["/canary", /href="\/canary"/g],
  ["/payments", /href="\/payments"/g],
  ["/testnet-help", /href="\/testnet-help/g],
];

for (const [label, re] of links) {
  console.log(label, count(home, re));
}

console.log("\n=== WHERE /guard/create APPEARS ===");
let i = 0;
for (const m of home.matchAll(/href="\/guard\/create"[^>]*>([^<]*)/g)) {
  i += 1;
  console.log(i, m[1].trim());
}

console.log("\n=== NAV DUPLICATION (mobile panel doubles nav links) ===");
console.log("portal-nav-links Get paid", count(home, /portal-nav-links[\s\S]*?href="\/guard\/create"/g));
console.log("nav-mobile-panel Get paid", count(home, /nav-mobile-panel[\s\S]*?href="\/guard\/create"/g));
