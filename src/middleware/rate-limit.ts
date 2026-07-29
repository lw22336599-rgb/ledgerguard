import type { MiddlewareHandler } from "hono";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
const OVERFLOW_BUCKET = "__overflow__";
let lastSweepAt = 0;

function getClientKey(headers: Headers): string {
  const vercelIp = headers.get("x-real-ip")?.trim();
  if (vercelIp) return vercelIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return "unknown";
}

function configuredLimit(): number {
  const parsed = Number.parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? "60", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10_000) : 60;
}

function sweepExpiredBuckets(now: number): void {
  if (now - lastSweepAt < 60_000) return;
  lastSweepAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export const rateLimit: MiddlewareHandler = async (context, next) => {
  const now = Date.now();
  sweepExpiredBuckets(now);

  let key = getClientKey(context.req.raw.headers);
  const limit = configuredLimit();
  let existing = buckets.get(key);
  if (!existing && buckets.size >= MAX_BUCKETS) {
    key = OVERFLOW_BUCKET;
    existing = buckets.get(key);
  }
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + 60_000 };

  bucket.count += 1;
  buckets.set(key, bucket);

  context.header("RateLimit-Limit", String(limit));
  context.header("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
  context.header("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > limit) {
    context.header("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return context.json({ error: "RATE_LIMITED" }, 429);
  }

  await next();
};
