import { ARC_TESTNET_USDC } from "./wallet-chains.js";

const addressForm = document.querySelector<HTMLFormElement>("#payments-address-form");
const addressInput = document.querySelector<HTMLInputElement>("#payments-address");
const addressResult = document.querySelector<HTMLElement>("#payments-address-result");

const verifyForm = document.querySelector<HTMLFormElement>("#payments-verify-form");
const txInput = document.querySelector<HTMLInputElement>("#payments-tx");
const recipientInput = document.querySelector<HTMLInputElement>("#payments-recipient");
const amountInput = document.querySelector<HTMLInputElement>("#payments-amount");
const payerInput = document.querySelector<HTMLInputElement>("#payments-payer");
const purposeInput = document.querySelector<HTMLInputElement>("#payments-purpose");
const verifyResult = document.querySelector<HTMLElement>("#payments-verify-result");

function showResult(
  target: HTMLElement | null,
  kind: string,
  heading: string,
  message: string,
  extra?: Node[],
): void {
  if (!target) return;
  target.hidden = false;
  target.className = `result ${kind}`;
  target.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = heading;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  target.append(title, paragraph);
  for (const node of extra ?? []) target.append(node);
}

function units(value: string): string {
  const parts = value.split(".");
  return (
    BigInt(parts[0] || "0") * 1_000_000n +
    BigInt(((parts[1] || "") + "000000").slice(0, 6))
  ).toString();
}

function applyQueryPrefill(): void {
  const params = new URLSearchParams(location.search);
  const tx = params.get("tx")?.trim();
  const recipient = params.get("recipient")?.trim();
  const amount = params.get("amount")?.trim();
  const payer = params.get("payer")?.trim();
  const purpose = params.get("purpose")?.trim();
  if (tx && txInput) txInput.value = tx;
  if (recipient && recipientInput) recipientInput.value = recipient;
  if (amount && amountInput) amountInput.value = amount;
  if (payer && payerInput) payerInput.value = payer;
  if (purpose && purposeInput) purposeInput.value = purpose;
}

applyQueryPrefill();

addressForm?.addEventListener(
  "invalid",
  () => {
    showResult(
      addressResult,
      "review",
      "Invalid address",
      "Enter a valid 0x receiving address.",
    );
  },
  true,
);

let verifyInvalidScheduled = false;

verifyForm?.addEventListener(
  "invalid",
  () => {
    if (verifyInvalidScheduled) return;
    verifyInvalidScheduled = true;
    queueMicrotask(() => {
      verifyInvalidScheduled = false;
      const field = verifyForm?.querySelector<HTMLInputElement>("input:invalid");
      const messages: Record<string, [string, string]> = {
        "payments-tx": [
          "Invalid transaction hash",
          "Paste the full 0x transaction hash from your wallet or ArcScan.",
        ],
        "payments-recipient": [
          "Invalid recipient",
          "Enter the receiving address from the Guard Link.",
        ],
        "payments-amount": [
          "Invalid amount",
          "Enter the USDC amount using up to six decimal places.",
        ],
        "payments-payer": [
          "Invalid payer",
          "Leave the optional payer empty or enter a valid 0x address.",
        ],
      };
      const [heading, message] = messages[field?.id ?? ""] ?? [
        "Review payment details",
        "Correct the highlighted field and try again.",
      ];
      showResult(verifyResult, "review", heading, message);
    });
  },
  true,
);

addressForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = addressInput?.value.trim() ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    showResult(
      addressResult,
      "review",
      "Invalid address",
      "Enter a valid 0x receiving address.",
    );
    return;
  }
  const explorer = document.createElement("a");
  explorer.href = `https://testnet.arcscan.app/address/${value}`;
  explorer.rel = "noreferrer";
  explorer.target = "_blank";
  explorer.textContent = "Open address on ArcScan";
  showResult(
    addressResult,
    "allow",
    "View onchain history",
    "LedgerGuard is non-custodial — incoming payments appear on Arc Testnet under your public address.",
    [explorer],
  );
});

verifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const txHash = txInput?.value.trim() ?? "";
  const recipient = recipientInput?.value.trim() ?? "";
  const amount = amountInput?.value.trim() ?? "";
  const payer = payerInput?.value.trim() ?? "";
  const purpose = purposeInput?.value.trim() || "Payment verification";

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    showResult(
      verifyResult,
      "review",
      "Invalid transaction hash",
      "Paste the full 0x transaction hash from your wallet or ArcScan.",
    );
    return;
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
    showResult(
      verifyResult,
      "review",
      "Invalid recipient",
      "Enter the receiving address from the Guard Link.",
    );
    return;
  }
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/.test(amount)) {
    showResult(
      verifyResult,
      "review",
      "Invalid amount",
      "Enter the USDC amount using up to six decimal places.",
    );
    return;
  }

  showResult(
    verifyResult,
    "neutral",
    "Checking transaction",
    "Reconciling the confirmed transfer against the declared payment…",
  );

  try {
    const intent: Record<string, string> = {
      action: "transfer",
      expectedRecipient: recipient,
      expectedAssetAddress: ARC_TESTNET_USDC,
      expectedAmountMicroUsdc: units(amount),
      purpose,
    };
    if (/^0x[0-9a-fA-F]{40}$/.test(payer)) {
      intent.expectedDebitAddress = payer;
    }

    const response = await fetch("/v1/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        network: "arcTestnet",
        txHash,
        intent,
      }),
    });
    const body = (await response.json()) as {
      status?: string;
      message?: string;
      error?: string;
    };

    if (response.status === 404) {
      showResult(
        verifyResult,
        "review",
        "Not confirmed yet",
        "The transaction is not indexed yet. Wait a moment and try again.",
      );
      return;
    }
    if (!response.ok) {
      throw new Error(body.message || body.error || "Evidence check failed");
    }

    const kind =
      body.status === "VERIFIED"
        ? "allow"
        : body.status === "MISMATCH"
          ? "block"
          : "review";
    const explorer = document.createElement("a");
    explorer.href = `https://testnet.arcscan.app/tx/${txHash}`;
    explorer.rel = "noreferrer";
    explorer.target = "_blank";
    explorer.textContent = "Open transaction on ArcScan";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(body, null, 2);
    showResult(
      verifyResult,
      kind,
      body.status ?? "Result",
      body.status === "VERIFIED"
        ? "The onchain transfer matches the declared Guard Link payment."
        : "Review the evidence before treating this payment as complete.",
      [explorer, pre],
    );
  } catch (error) {
    showResult(
      verifyResult,
      "error",
      "Verification failed",
      error instanceof Error ? error.message : "Evidence check failed.",
    );
  }
});
