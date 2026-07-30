import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export type AppEnvironment = {
  Variables: {
    requestId: string;
  };
};

const CLIENT_PATTERN = /^[a-zA-Z0-9._/@ -]{1,80}$/;

function safeClient(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && CLIENT_PATTERN.test(trimmed) ? trimmed : "unknown";
}

export const requestTelemetry: MiddlewareHandler<AppEnvironment> = async (
  context,
  next,
) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  context.set("requestId", requestId);
  context.header("X-LedgerGuard-Request-Id", requestId);

  await next();

  console.info({
    event: "request.completed",
    requestId,
    method: context.req.method,
    path: context.req.path,
    status: context.res.status,
    durationMs: Date.now() - startedAt,
    client: safeClient(context.req.header("x-ledgerguard-client")),
    integration: safeClient(
      context.req.header("x-ledgerguard-integration"),
    ),
  });
};
