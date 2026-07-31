export type DeveloperWebhookEvent = {
  type: "preflight.completed" | "evidence.completed";
  requestId: string;
  integration?: string;
  occurredAt: string;
  result: Record<string, unknown>;
};

export async function deliverDeveloperWebhook(
  url: string,
  event: DeveloperWebhookEvent,
): Promise<"delivered" | "failed"> {
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
