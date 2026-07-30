import { createHash, randomBytes, randomUUID } from "node:crypto";

export type Tenant = {
  id: string;
  name: string;
  plan: "testnet";
  quotaPerMonth: number;
  createdAt: string;
  keyVersion: number;
};

export type UsageEvent = {
  requestId: string;
  operation: string;
  occurredAt: string;
  units: number;
};

export type UsageSummary = {
  period: string;
  used: number;
  limit: number;
  remaining: number;
  recent: UsageEvent[];
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
  register(name: string): Promise<Registration>;
  authenticate(apiKey: string): Promise<Tenant | null>;
  rotateKey(tenant: Tenant, currentApiKey: string): Promise<string>;
  recordUsage(
    tenant: Tenant,
    operation: string,
    requestId: string,
  ): Promise<UsageSummary>;
  usage(tenant: Tenant): Promise<UsageSummary>;
  recordPayment(event: PaymentLedgerEvent): Promise<"recorded" | "duplicate">;
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

const API_KEY_PATTERN = /^lg_test_[A-Za-z0-9_-]{32,80}$/;
const DEFAULT_MONTHLY_QUOTA = 1_000;
const DEFAULT_MAX_TENANTS = 100;
const EVENT_RETENTION_SECONDS = 90 * 24 * 60 * 60;

function maximumTenants(): number {
  const parsed = Number.parseInt(process.env.DEVELOPER_MAX_TENANTS ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_TENANTS;
}

function keyHash(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
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

  async register(name: string): Promise<Registration> {
    const count = parseInteger(
      await this.redis.command(["INCR", "ledgerguard:tenant-count"]),
    );
    if (count > maximumTenants()) {
      await this.redis
        .command(["DECR", "ledgerguard:tenant-count"])
        .catch(() => undefined);
      throw new TenantCapacityError();
    }
    const tenant: Tenant = {
      id: randomUUID(),
      name,
      plan: "testnet",
      quotaPerMonth: DEFAULT_MONTHLY_QUOTA,
      createdAt: new Date().toISOString(),
      keyVersion: 1,
    };
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
      return JSON.parse(stored) as Tenant;
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
  ): Promise<UsageSummary> {
    const event: UsageEvent = {
      requestId,
      operation,
      occurredAt: new Date().toISOString(),
      units: 1,
    };
    const script =
      "local n=tonumber(redis.call('GET',KEYS[1]) or '0');" +
      "if n>=tonumber(ARGV[1]) then return {0,n}; end;" +
      "n=redis.call('INCR',KEYS[1]);" +
      "redis.call('EXPIRE',KEYS[1],ARGV[2]);" +
      "redis.call('LPUSH',KEYS[2],ARGV[3]);" +
      "redis.call('LTRIM',KEYS[2],0,49);" +
      "redis.call('EXPIRE',KEYS[2],ARGV[2]);" +
      "return {1,n};";
    const result = await this.redis.command([
      "EVAL",
      script,
      2,
      usageKey(tenant.id),
      eventKey(tenant.id),
      tenant.quotaPerMonth,
      EVENT_RETENTION_SECONDS,
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
    return summary(tenant, used, recent);
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
}

class MemoryTenantStore implements TenantStore {
  private readonly tenants = new Map<string, Tenant>();
  private readonly keys = new Map<string, string>();
  private readonly usageCounts = new Map<string, number>();
  private readonly events = new Map<string, UsageEvent[]>();
  private readonly payments = new Set<string>();

  async health(): Promise<boolean> {
    return true;
  }

  async register(name: string): Promise<Registration> {
    if (this.tenants.size >= maximumTenants()) {
      throw new TenantCapacityError();
    }
    const tenant: Tenant = {
      id: randomUUID(),
      name,
      plan: "testnet",
      quotaPerMonth: DEFAULT_MONTHLY_QUOTA,
      createdAt: new Date().toISOString(),
      keyVersion: 1,
    };
    const apiKey = createApiKey();
    this.tenants.set(tenant.id, tenant);
    this.keys.set(keyHash(apiKey), tenant.id);
    return { tenant, apiKey };
  }

  async authenticate(apiKey: string): Promise<Tenant | null> {
    if (!API_KEY_PATTERN.test(apiKey)) return null;
    const tenantId = this.keys.get(keyHash(apiKey));
    return tenantId ? this.tenants.get(tenantId) ?? null : null;
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
  ): Promise<UsageSummary> {
    const key = usageKey(tenant.id);
    const existing = this.usageCounts.get(key) ?? 0;
    if (existing >= tenant.quotaPerMonth) {
      throw new QuotaExceededError(
        summary(
          tenant,
          existing,
          (this.events.get(tenant.id) ?? []).slice(0, 20),
        ),
      );
    }
    const used = existing + 1;
    this.usageCounts.set(key, used);
    const recent = this.events.get(tenant.id) ?? [];
    recent.unshift({
      requestId,
      operation,
      occurredAt: new Date().toISOString(),
      units: 1,
    });
    this.events.set(tenant.id, recent.slice(0, 50));
    return summary(tenant, used, recent.slice(0, 20));
  }

  async usage(tenant: Tenant): Promise<UsageSummary> {
    return summary(
      tenant,
      this.usageCounts.get(usageKey(tenant.id)) ?? 0,
      (this.events.get(tenant.id) ?? []).slice(0, 20),
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
