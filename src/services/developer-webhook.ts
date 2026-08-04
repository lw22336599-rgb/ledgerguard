export type DeveloperWebhookEvent = {
  type: "preflight.completed" | "evidence.completed";
  requestId: string;
  integration?: string;
  occurredAt: string;
  result: Record<string, unknown>;
};

function configuredWebhookHosts(): Set<string> {
  return new Set(
    (process.env.DEVELOPER_WEBHOOK_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Fail closed unless the operator explicitly allows the exact HTTPS host. */
export function isDeveloperWebhookAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === "" &&
      configuredWebhookHosts().has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export async function deliverDeveloperWebhook(
  url: string,
  event: DeveloperWebhookEvent,
): Promise<"delivered" | "failed"> {
  if (!isDeveloperWebhookAllowed(url)) return "failed";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "LedgerGuard-Webhook/0.1",
        "x-ledgerguard-event": event.type,
        "x-ledgerguard-request-id": event.requestId,
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
    return response.ok ? "delivered" : "failed";
  } catch {
    return "failed";
  } finally {
    clearTimeout(timer);
  }
}
