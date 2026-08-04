import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getPlan, normalizePlanId, type PlanId } from "../config/plans.js";

export type TenantStatus = "active" | "suspended" | "expired";

export type Tenant = {
  id: string;
  name: string;
  plan: PlanId;
  status: TenantStatus;
  quotaPerMonth: number;
  createdAt: string;
  expiresAt: string;
  keyVersion: number;
  webhookUrl?: string | null;
};

export type UsageEvent = {
  requestId: string;
  operation: string;
  occurredAt: string;
  units: number;
  integrationIdHash?: string;
};

export type UsageSummary = {
  period: string;
  used: number;
  limit: number;
  remaining: number;
  recent: UsageEvent[];
};

export type IntegrationProof = {
  tenantId: string;
  plan: PlanId;
  generatedAt: string;
  externallyVerified: false;
  eligibleIntegrationEvents: number;
  activeDays: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  repeatsAcross14Days: boolean;
  integrationIdHashes: string[];
  requestIds: string[];
};

export type TenantEntitlements = {
  plan: PlanId;
  monthlyOperations: number | null;
  retentionDays: number | null;
  projects: number | null;
  selfService: boolean;
  availability: "available" | "validation" | "contract";
};

export type PaymentLedgerEvent = {
  requestId: string;
  payer: string;
  settlementTransaction: string;
  amountMicroUsdc: string;
  network: "arcTestnet";
  recordedAt: string;
};

export type Registration = {
  tenant: Tenant;
  apiKey: string;
};

export type TenantStore = {
  health(): Promise<boolean>;
  register(name: string, registrationFingerprint?: string): Promise<Registration>;
  authenticate(apiKey: string): Promise<Tenant | null>;
  rotateKey(tenant: Tenant, currentApiKey: string): Promise<string>;
  recordUsage(
    tenant: Tenant,
    operation: string,
    requestId: string,
    integrationId?: string,
  ): Promise<UsageSummary>;
  usage(tenant: Tenant): Promise<UsageSummary>;
  integrationProof(tenant: Tenant): Promise<IntegrationProof>;
  recordPayment(event: PaymentLedgerEvent): Promise<"recorded" | "duplicate">;
  updateWebhook(tenant: Tenant, url: string | null): Promise<Tenant>;
};

export class QuotaExceededError extends Error {
  constructor(readonly usage: UsageSummary) {
    super("The monthly testnet quota has been exhausted.");
  }
}

export class TenantCapacityError extends Error {
  constructor() {
    super("The testnet tenant capacity has been reached.");
  }
}

export class RegistrationRateLimitError extends Error {
  constructor() {
    super("The daily registration limit for this client has been reached.");
  }
}

const API_KEY_PATTERN = /^lg_test_[A-Za-z0-9_-]{32,80}$/;
const DEFAULT_MAX_TENANTS = 100;
const DEFAULT_REGISTRATIONS_PER_DAY = 3;
const SANDBOX_LIFETIME_DAYS = 90;
const EVENT_RETENTION_SECONDS = 90 * 24 * 60 * 60;
const USAGE_COUNTER_RETENTION_SECONDS = 40 * 24 * 60 * 60;
const INTEGRATION_ID_PATTERN = /^[A-Za-z0-9._/@ -]{1,80}$/;

function maximumTenants(): number {
  const parsed = Number.parseInt(process.env.DEVELOPER_MAX_TENANTS ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_TENANTS;
}

function maximumRegistrationsPerDay(): number {
  const parsed = Number.parseInt(
    process.env.DEVELOPER_REGISTRATIONS_PER_DAY ?? "",
    10,
  );
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 20)
    : DEFAULT_REGISTRATIONS_PER_DAY;
}

function sandboxExpiry(createdAt: string): string {
  return new Date(
    Date.parse(createdAt) + SANDBOX_LIFETIME_DAYS * 24 * 60 * 60 * 1_000,
  ).toISOString();
}

function normalizeTenant(value: unknown): Tenant | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Tenant> & { plan?: unknown };
  if (
    typeof source.id !== "string" ||
    typeof source.name !== "string" ||
    typeof source.createdAt !== "string" ||
    typeof source.keyVersion !== "number"
  ) {
    return null;
  }
  const plan = normalizePlanId(source.plan);
  const definition = getPlan(plan);
  const expiresAt =
    typeof source.expiresAt === "string"
      ? source.expiresAt
      : sandboxExpiry(source.createdAt);
  const configuredStatus: TenantStatus =
    source.status === "suspended" || source.status === "expired"
      ? source.status
      : "active";
  const status: TenantStatus =
    configuredStatus === "active" && Date.parse(expiresAt) <= Date.now()
      ? "expired"
      : configuredStatus;
  return {
    id: source.id,
    name: source.name,
    plan,
    status,
    quotaPerMonth: definition.monthlyOperations ?? 0,
    createdAt: source.createdAt,
    expiresAt,
    keyVersion: source.keyVersion,
    ...(source.webhookUrl !== undefined
      ? { webhookUrl: source.webhookUrl }
      : {}),
  };
}

export function tenantEntitlements(tenant: Tenant): TenantEntitlements {
  const plan = getPlan(tenant.plan);
  return {
    plan: plan.id,
    monthlyOperations: plan.monthlyOperations,
    retentionDays: plan.retentionDays,
    projects: plan.projects,
    selfService: plan.selfService,
    availability: plan.availability,
  };
}

function eventRetentionSeconds(tenant: Tenant): number {
  return Math.max(1, getPlan(tenant.plan).retentionDays ?? 90) * 24 * 60 * 60;
}

function retainedEvents(tenant: Tenant, events: UsageEvent[]): UsageEvent[] {
  const cutoff = Date.now() - eventRetentionSeconds(tenant) * 1_000;
  return events.filter((event) => {
    const occurredAt = Date.parse(event.occurredAt);
    return Number.isFinite(occurredAt) && occurredAt >= cutoff;
  });
}

function createSandboxTenant(name: string): Tenant {
  const createdAt = new Date().toISOString();
  const plan = getPlan("sandbox");
  return {
    id: randomUUID(),
    name,
    plan: "sandbox",
    status: "active",
    quotaPerMonth: plan.monthlyOperations ?? 0,
    createdAt,
    expiresAt: sandboxExpiry(createdAt),
    keyVersion: 1,
  };
}

function keyHash(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}

function hashIntegrationId(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized || !INTEGRATION_ID_PATTERN.test(normalized)) return undefined;
  return `sha256:${createHash("sha256").update(normalized, "utf8").digest("hex")}`;
}

function createApiKey(): string {
  return `lg_test_${randomBytes(32).toString("base64url")}`;
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

function tenantKey(id: string): string {
  return `ledgerguard:tenant:${id}`;
}

function apiKeyKey(apiKey: string): string {
  return `ledgerguard:api:${keyHash(apiKey)}`;
}

function usageKey(id: string, period = currentPeriod()): string {
  return `ledgerguard:usage:${id}:${period}`;
}

function eventKey(id: string): string {
  return `ledgerguard:events:${id}`;
}

function registrationKey(fingerprint?: string): string {
  const value = fingerprint?.trim() || "unknown";
  return `ledgerguard:registration:${keyHash(value)}:${currentPeriod()}-${new Date()
    .toISOString()
    .slice(8, 10)}`;
}

function buildIntegrationProof(
  tenant: Tenant,
  recent: UsageEvent[],
): IntegrationProof {
  const eligible = recent.filter((event) => event.integrationIdHash);
  const ordered = eligible
    .map((event) => event.occurredAt)
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort();
  const activeDays = new Set(ordered.map((value) => value.slice(0, 10))).size;
  const firstSeenAt = ordered[0] ?? null;
  const lastSeenAt = ordered.at(-1) ?? null;
  return {
    tenantId: tenant.id,
    plan: tenant.plan,
    generatedAt: new Date().toISOString(),
    externallyVerified: false,
    eligibleIntegrationEvents: eligible.length,
    activeDays,
    firstSeenAt,
    lastSeenAt,
    repeatsAcross14Days:
      activeDays >= 2 &&
      firstSeenAt !== null &&
      lastSeenAt !== null &&
      Date.parse(lastSeenAt) - Date.parse(firstSeenAt) >= 13 * 24 * 60 * 60 * 1_000,
    integrationIdHashes: [
      ...new Set(eligible.flatMap((event) => event.integrationIdHash ?? [])),
    ],
    requestIds: eligible.map((event) => event.requestId),
  };
}

function parseInteger(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(typeof value === "string" ? value : "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function summary(
  tenant: Tenant,
  used: number,
  recent: UsageEvent[],
): UsageSummary {
  return {
    period: currentPeriod(),
    used,
    limit: tenant.quotaPerMonth,
    remaining: Math.max(0, tenant.quotaPerMonth - used),
    recent,
  };
}

type RedisResult = { result?: unknown; error?: string };

class RedisRestClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async request(path: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${this.url}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new Error(`Durable store returned HTTP ${response.status}.`);
    }
    return response.json();
  }

  async command(command: Array<string | number>): Promise<unknown> {
    const body = (await this.request("", command)) as RedisResult;
    if (body.error) throw new Error("Durable store command failed.");
    return body.result;
  }

  async pipeline(
    commands: Array<Array<string | number>>,
  ): Promise<unknown[]> {
    const body = (await this.request("/pipeline", commands)) as RedisResult[];
    if (!Array.isArray(body) || body.some((item) => item.error)) {
      throw new Error("Durable store pipeline failed.");
    }
    return body.map((item) => item.result);
  }
}

class RedisTenantStore implements TenantStore {
  constructor(private readonly redis: RedisRestClient) {}

  async health(): Promise<boolean> {
    return (await this.redis.command(["PING"])) === "PONG";
  }

  async register(
    name: string,
    registrationFingerprint?: string,
  ): Promise<Registration> {
    const registrationCount = parseInteger(
      await this.redis.command(["INCR", registrationKey(registrationFingerprint)]),
    );
    await this.redis.command([
      "EXPIRE",
      registrationKey(registrationFingerprint),
      2 * 24 * 60 * 60,
    ]);
    if (registrationCount > maximumRegistrationsPerDay()) {
      throw new RegistrationRateLimitError();
    }
    const count = parseInteger(
      await this.redis.command(["INCR", "ledgerguard:tenant-count"]),
    );
    if (count > maximumTenants()) {
      await this.redis
        .command(["DECR", "ledgerguard:tenant-count"])
        .catch(() => undefined);
      throw new TenantCapacityError();
    }
    const tenant = createSandboxTenant(name);
    const apiKey = createApiKey();
    const claimed = await this.redis.command([
      "SET",
      apiKeyKey(apiKey),
      tenant.id,
      "NX",
    ]);
    if (claimed !== "OK") {
      await this.redis
        .command(["DECR", "ledgerguard:tenant-count"])
        .catch(() => undefined);
      throw new Error("Could not allocate an API key.");
    }
    try {
      await this.redis.command([
        "SET",
        tenantKey(tenant.id),
        JSON.stringify(tenant),
        "NX",
      ]);
    } catch (error) {
      await this.redis
        .pipeline([
          ["DEL", apiKeyKey(apiKey)],
          ["DECR", "ledgerguard:tenant-count"],
        ])
        .catch(() => undefined);
      throw error;
    }
    return { tenant, apiKey };
  }

  async authenticate(apiKey: string): Promise<Tenant | null> {
    if (!API_KEY_PATTERN.test(apiKey)) return null;
    const tenantId = await this.redis.command(["GET", apiKeyKey(apiKey)]);
    if (typeof tenantId !== "string") return null;
    const stored = await this.redis.command(["GET", tenantKey(tenantId)]);
    if (typeof stored !== "string") return null;
    try {
      const tenant = normalizeTenant(JSON.parse(stored));
      return tenant?.status === "active" ? tenant : null;
    } catch {
      return null;
    }
  }

  async rotateKey(tenant: Tenant, currentApiKey: string): Promise<string> {
    const newApiKey = createApiKey();
    const nextTenant: Tenant = {
      ...tenant,
      keyVersion: tenant.keyVersion + 1,
    };
    const claimed = await this.redis.command([
      "SET",
      apiKeyKey(newApiKey),
      tenant.id,
      "NX",
    ]);
    if (claimed !== "OK") throw new Error("Could not rotate the API key.");
    await this.redis.pipeline([
      ["SET", tenantKey(tenant.id), JSON.stringify(nextTenant)],
      ["DEL", apiKeyKey(currentApiKey)],
    ]);
    return newApiKey;
  }

  async recordUsage(
    tenant: Tenant,
    operation: string,
    requestId: string,
    integrationId?: string,
  ): Promise<UsageSummary> {
    const integrationIdHash = hashIntegrationId(integrationId);
    const event: UsageEvent = {
      requestId,
      operation,
      occurredAt: new Date().toISOString(),
      units: 1,
      ...(integrationIdHash ? { integrationIdHash } : {}),
    };
    const script =
      "local n=tonumber(redis.call('GET',KEYS[1]) or '0');" +
      "if n>=tonumber(ARGV[1]) then return {0,n}; end;" +
      "n=redis.call('INCR',KEYS[1]);" +
      "redis.call('EXPIRE',KEYS[1],ARGV[2]);" +
      "redis.call('LPUSH',KEYS[2],ARGV[4]);" +
      "redis.call('LTRIM',KEYS[2],0,49);" +
      "redis.call('EXPIRE',KEYS[2],ARGV[3]);" +
      "return {1,n};";
    const result = await this.redis.command([
      "EVAL",
      script,
      2,
      usageKey(tenant.id),
      eventKey(tenant.id),
      tenant.quotaPerMonth,
      USAGE_COUNTER_RETENTION_SECONDS,
      eventRetentionSeconds(tenant),
      JSON.stringify(event),
    ]);
    const tuple = Array.isArray(result) ? result : [];
    const used = parseInteger(tuple[1]);
    const current = await this.usageWithCount(tenant, used);
    if (parseInteger(tuple[0]) !== 1) throw new QuotaExceededError(current);
    return current;
  }

  async usage(tenant: Tenant): Promise<UsageSummary> {
    const used = parseInteger(
      await this.redis.command(["GET", usageKey(tenant.id)]),
    );
    return this.usageWithCount(tenant, used);
  }

  async integrationProof(tenant: Tenant): Promise<IntegrationProof> {
    const values = await this.redis.command(["LRANGE", eventKey(tenant.id), 0, 49]);
    const recent = Array.isArray(values)
      ? values.flatMap((value) => {
          if (typeof value !== "string") return [];
          try {
            return [JSON.parse(value) as UsageEvent];
          } catch {
            return [];
          }
        })
      : [];
    return buildIntegrationProof(tenant, retainedEvents(tenant, recent));
  }

  private async usageWithCount(
    tenant: Tenant,
    used: number,
  ): Promise<UsageSummary> {
    const values = await this.redis.command([
      "LRANGE",
      eventKey(tenant.id),
      0,
      19,
    ]);
    const recent = Array.isArray(values)
      ? values.flatMap((value) => {
          if (typeof value !== "string") return [];
          try {
            return [JSON.parse(value) as UsageEvent];
          } catch {
            return [];
          }
        })
      : [];
    return summary(tenant, used, retainedEvents(tenant, recent));
  }

  async recordPayment(
    event: PaymentLedgerEvent,
  ): Promise<"recorded" | "duplicate"> {
    const fingerprint = keyHash(
      `${event.network}:${event.settlementTransaction.toLowerCase()}`,
    );
    const paymentKey = `ledgerguard:payment:${fingerprint}`;
    const claimed = await this.redis.command([
      "SET",
      paymentKey,
      JSON.stringify(event),
      "NX",
      "EX",
      EVENT_RETENTION_SECONDS,
    ]);
    if (claimed !== "OK") return "duplicate";
    await this.redis.pipeline([
      ["LPUSH", "ledgerguard:payments", JSON.stringify(event)],
      ["LTRIM", "ledgerguard:payments", 0, 999],
    ]);
    return "recorded";
  }

  async updateWebhook(tenant: Tenant, url: string | null): Promise<Tenant> {
    const nextTenant: Tenant = {
      ...tenant,
      webhookUrl: url,
    };
    await this.redis.command([
      "SET",
      tenantKey(tenant.id),
      JSON.stringify(nextTenant),
    ]);
    return nextTenant;
  }
}

class MemoryTenantStore implements TenantStore {
  private readonly tenants = new Map<string, Tenant>();
  private readonly keys = new Map<string, string>();
  private readonly usageCounts = new Map<string, number>();
  private readonly events = new Map<string, UsageEvent[]>();
  private readonly payments = new Set<string>();
  private readonly registrationCounts = new Map<string, number>();

  async health(): Promise<boolean> {
    return true;
  }

  async register(
    name: string,
    registrationFingerprint?: string,
  ): Promise<Registration> {
    const registration = registrationKey(registrationFingerprint);
    const count = (this.registrationCounts.get(registration) ?? 0) + 1;
    this.registrationCounts.set(registration, count);
    if (count > maximumRegistrationsPerDay()) {
      throw new RegistrationRateLimitError();
    }
    if (this.tenants.size >= maximumTenants()) {
      throw new TenantCapacityError();
    }
    const tenant = createSandboxTenant(name);
    const apiKey = createApiKey();
    this.tenants.set(tenant.id, tenant);
    this.keys.set(keyHash(apiKey), tenant.id);
    return { tenant, apiKey };
  }

  async authenticate(apiKey: string): Promise<Tenant | null> {
    if (!API_KEY_PATTERN.test(apiKey)) return null;
    const tenantId = this.keys.get(keyHash(apiKey));
    const tenant = tenantId ? this.tenants.get(tenantId) ?? null : null;
    const normalized = normalizeTenant(tenant);
    return normalized?.status === "active" ? normalized : null;
  }

  async rotateKey(tenant: Tenant, currentApiKey: string): Promise<string> {
    const nextTenant = { ...tenant, keyVersion: tenant.keyVersion + 1 };
    const newApiKey = createApiKey();
    this.keys.delete(keyHash(currentApiKey));
    this.keys.set(keyHash(newApiKey), tenant.id);
    this.tenants.set(tenant.id, nextTenant);
    return newApiKey;
  }

  async recordUsage(
    tenant: Tenant,
    operation: string,
    requestId: string,
    integrationId?: string,
  ): Promise<UsageSummary> {
    const key = usageKey(tenant.id);
    const existing = this.usageCounts.get(key) ?? 0;
    if (existing >= tenant.quotaPerMonth) {
      throw new QuotaExceededError(
        summary(
          tenant,
          existing,
          retainedEvents(tenant, this.events.get(tenant.id) ?? []).slice(0, 20),
        ),
      );
    }
    const used = existing + 1;
    this.usageCounts.set(key, used);
    const recent = retainedEvents(tenant, this.events.get(tenant.id) ?? []);
    const integrationIdHash = hashIntegrationId(integrationId);
    recent.unshift({
      requestId,
      operation,
      occurredAt: new Date().toISOString(),
      units: 1,
      ...(integrationIdHash ? { integrationIdHash } : {}),
    });
    this.events.set(tenant.id, recent.slice(0, 50));
    return summary(tenant, used, recent.slice(0, 20));
  }

  async usage(tenant: Tenant): Promise<UsageSummary> {
    return summary(
      tenant,
      this.usageCounts.get(usageKey(tenant.id)) ?? 0,
      retainedEvents(tenant, this.events.get(tenant.id) ?? []).slice(0, 20),
    );
  }

  async integrationProof(tenant: Tenant): Promise<IntegrationProof> {
    return buildIntegrationProof(
      tenant,
      retainedEvents(tenant, this.events.get(tenant.id) ?? []),
    );
  }

  async recordPayment(
    event: PaymentLedgerEvent,
  ): Promise<"recorded" | "duplicate"> {
    const fingerprint = keyHash(
      `${event.network}:${event.settlementTransaction.toLowerCase()}`,
    );
    if (this.payments.has(fingerprint)) return "duplicate";
    this.payments.add(fingerprint);
    return "recorded";
  }

  async updateWebhook(tenant: Tenant, url: string | null): Promise<Tenant> {
    const nextTenant: Tenant = {
      ...tenant,
      webhookUrl: url,
    };
    this.tenants.set(tenant.id, nextTenant);
    return nextTenant;
  }
}

let cachedStore: TenantStore | null | undefined;

export function selfServiceEnabled(): boolean {
  return process.env.DEVELOPER_SELF_SERVICE_ENABLED === "true";
}

export function getTenantStore(): TenantStore | null {
  if (cachedStore !== undefined) return cachedStore;
  if (
    process.env.NODE_ENV === "test" &&
    process.env.LEDGERGUARD_STORAGE_BACKEND === "memory"
  ) {
    cachedStore = new MemoryTenantStore();
    return cachedStore;
  }
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  cachedStore =
    url && token
      ? new RedisTenantStore(
          new RedisRestClient(url.replace(/\/+$/, ""), token),
        )
      : null;
  return cachedStore;
}

export function resetTenantStoreForTests(): void {
  cachedStore = undefined;
}
