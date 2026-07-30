import QRCode from "qrcode";

const form = document.querySelector<HTMLFormElement>("#guard-builder");
const result = document.querySelector<HTMLElement>("#guard-builder-result");
const created = document.querySelector<HTMLInputElement>("#guard-created-url");
const actions = document.querySelector<HTMLElement>("#guard-builder-actions");
const open = document.querySelector<HTMLAnchorElement>("#guard-open");
const copy = document.querySelector<HTMLButtonElement>("#guard-copy");
const share = document.querySelector<HTMLButtonElement>("#guard-share");
const qrWrap = document.querySelector<HTMLElement>("#guard-qr-wrap");
const qrCanvas = document.querySelector<HTMLCanvasElement>("#guard-qr-canvas");

let currentUrl = "";

function show(kind: string, title: string, message: string): void {
  if (!result) return;
  result.className = `result ${kind}`;
  const heading = result.querySelector("strong");
  const paragraph = result.querySelector("p");
  if (heading) heading.textContent = title;
  if (paragraph) paragraph.textContent = message;
}

async function renderQr(url: string): Promise<void> {
  if (!qrWrap || !qrCanvas) return;
  qrWrap.hidden = true;
  try {
    await QRCode.toCanvas(qrCanvas, url, {
      width: 200,
      margin: 2,
      color: {
        dark: "#f4f6ff",
        light: "#060817",
      },
    });
    qrWrap.hidden = false;
  } catch {
    qrWrap.hidden = true;
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form || !actions || !created) return;

  const chain =
    document.querySelector<HTMLSelectElement>("#guard-chain")?.value ??
    "arc-testnet";
  if (chain !== "arc-testnet") {
    show(
      "review",
      "Base Mainnet coming soon",
      "Guard Links on Base Mainnet are not live yet. Switch to Arc Testnet, or try the mainnet canary at /canary.",
    );
    return;
  }

  actions.hidden = true;
  created.hidden = true;
  if (qrWrap) qrWrap.hidden = true;
  show("neutral", "Creating link", "Validating the payment request…");

  const expiryHours = Number(
    document.querySelector<HTMLInputElement>("#guard-expiry-hours")?.value,
  );
  const payload = {
    issuer:
      document.querySelector<HTMLInputElement>("#guard-issuer")?.value.trim() ||
      undefined,
    recipient:
      document.querySelector<HTMLInputElement>("#guard-recipient")?.value.trim() ??
      "",
    amount:
      document.querySelector<HTMLInputElement>("#guard-amount")?.value.trim() ?? "",
    limit:
      document.querySelector<HTMLInputElement>("#guard-limit")?.value.trim() ?? "",
    purpose:
      document.querySelector<HTMLInputElement>("#guard-purpose")?.value.trim() ??
      "",
    expires: new Date(Date.now() + expiryHours * 3_600_000).toISOString(),
  };

  try {
    const response = await fetch("/v1/guard-links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      url?: string;
      intentId?: string;
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(body.message || body.error || "Could not create link");
    }

    currentUrl = body.url ?? "";
    created.value = currentUrl;
    created.hidden = false;
    if (open) open.href = currentUrl;
    actions.hidden = false;
    await renderQr(currentUrl);
    show(
      "allow",
      "Payment link ready",
      `Share the link or QR code. Intent reference: ${body.intentId ?? "n/a"}`,
    );
  } catch (error) {
    show(
      "error",
      "Could not create link",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

copy?.addEventListener("click", async () => {
  if (!currentUrl) return;
  try {
    await navigator.clipboard.writeText(currentUrl);
    show("allow", "Link copied", "The payment link is ready to share.");
  } catch {
    created?.focus();
    created?.select();
    show("review", "Copy manually", "Select and copy the displayed URL.");
  }
});

share?.addEventListener("click", async () => {
  if (!currentUrl) return;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "USDC payment request",
        text: "Review and pay this USDC request in your wallet.",
        url: currentUrl,
      });
      return;
    } catch {
      // Fall through to clipboard copy.
    }
  }
  try {
    await navigator.clipboard.writeText(currentUrl);
    show(
      "allow",
      "Link copied",
      "Native sharing was unavailable, so the link was copied.",
    );
  } catch {
    show("review", "Share manually", "Copy the displayed URL.");
  }
});
