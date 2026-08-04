const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (!key.startsWith("--")) continue;
  const next = process.argv[index + 1];
  if (next && !next.startsWith("--")) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, true);
  }
}

const tenantId = args.get("--tenant");
const requestedStatus = args.get("--status");
const apply = args.has("--apply");
const allowedStatuses = new Set(["active", "suspended", "expired"]);

if (typeof tenantId !== "string" || !/^[0-9a-f-]{36}$/i.test(tenantId)) {
  throw new Error("Provide a tenant UUID with --tenant <uuid>.");
}
if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
  throw new Error("--status must be active, suspended, or expired.");
}
if (apply && !requestedStatus) throw new Error("--apply also requires --status.");

const baseUrl = (
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? ""
).replace(/\/+$/, "");
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!baseUrl || !token) {
  throw new Error("The durable-store URL and token must be configured locally.");
}

async function command(parts) {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(parts),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Durable store returned HTTP ${response.status}.`);
  const body = await response.json();
  if (body.error) throw new Error("Durable store rejected the command.");
  return body.result;
}

const key = `ledgerguard:tenant:${tenantId}`;
const stored = await command(["GET", key]);
if (typeof stored !== "string") throw new Error("Tenant was not found.");
const tenant = JSON.parse(stored);
const safeView = {
  id: tenant.id,
  name: tenant.name,
  plan: tenant.plan,
  status: tenant.status ?? "active (legacy)",
  createdAt: tenant.createdAt,
  expiresAt: tenant.expiresAt ?? null,
  keyVersion: tenant.keyVersion,
};

if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", tenant: safeView, requestedStatus: requestedStatus ?? null }, null, 2));
  process.exit(0);
}

await command(["SET", key, JSON.stringify({ ...tenant, status: requestedStatus })]);
console.log(JSON.stringify({ mode: "applied", tenant: { ...safeView, status: requestedStatus } }, null, 2));
