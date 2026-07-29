import { getNetworkRegistry } from "../config/networks.js";
import { withDeadline } from "../lib/rpc.js";

interface PaymentEvent {
  payer: string;
  transaction: string;
  amountMicroUsdc: string;
}

interface PaymentNotification extends PaymentEvent {
  requestId: string;
}

export function paymentReceipt(event: PaymentEvent) {
  const explorer = getNetworkRegistry().arcTestnet.explorerUrl;
  return {
    payer: event.payer,
    settlementTransaction: event.transaction,
    amountMicroUsdc: event.amountMicroUsdc,
    network: "arcTestnet",
    explorerUrl: `${explorer}/tx/${event.transaction}`,
  };
}

export async function notifyPaymentSettlement(
  event: PaymentNotification,
): Promise<boolean> {
  const configured = process.env.OPERATIONS_WEBHOOK_URL?.trim();
  if (!configured) return false;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    console.warn({ event: "operations.notification.invalid_url" });
    return false;
  }
  if (url.protocol !== "https:") {
    console.warn({ event: "operations.notification.insecure_url" });
    return false;
  }

  try {
    const response = await withDeadline(
      fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "payment.settled",
          requestId: event.requestId,
          network: "arcTestnet",
          payer: event.payer,
          settlementTransaction: event.transaction,
          amountMicroUsdc: event.amountMicroUsdc,
          explorerUrl: paymentReceipt(event).explorerUrl,
          occurredAt: new Date().toISOString(),
        }),
      }),
      3_000,
    );
    return response.ok;
  } catch (error) {
    console.warn({
      event: "operations.notification.failed",
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
}
