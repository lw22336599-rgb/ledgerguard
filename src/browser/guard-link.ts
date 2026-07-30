import { ARC_TESTNET, ARC_TESTNET_USDC } from "./wallet-chains.js";

const root = document.querySelector<HTMLElement>("#guard-wallet");
const connect = document.querySelector<HTMLButtonElement>("#connect-wallet");
const send = document.querySelector<HTMLButtonElement>("#send-payment");
const verify = document.querySelector<HTMLButtonElement>("#verify-evidence");
const status = document.querySelector<HTMLElement>("#wallet-status");
const output = document.querySelector<HTMLElement>("#wallet-result");
const cta = document.querySelector<HTMLElement>("#guard-cta");
const wallet = window.LedgerGuardWallet;

const usdc = ARC_TESTNET_USDC;

let account = "";
let txHash = "";

function show(kind: string, html: string): void {
  if (!output) return;
  output.hidden = false;
  output.className = `result ${kind}`;
  output.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.textContent = html;
  output.append(paragraph);
}

function units(value: string): string {
  const parts = value.split(".");
  return (
    BigInt(parts[0] || "0") * 1_000_000n +
    BigInt(((parts[1] || "") + "000000").slice(0, 6))
  ).toString();
}

function transferData(): string {
  const recipient = root!.dataset.recipient!.slice(2).toLowerCase().padStart(64, "0");
  const amount = BigInt(units(root!.dataset.amount!)).toString(16).padStart(64, "0");
  return `0xa9059cbb${recipient}${amount}`;
}

function activateVerifiedCta(payerAddress: string): void {
  if (!cta) return;
  cta.classList.add("guard-cta-highlight", "guard-cta-verified");
  const link = cta.querySelector<HTMLAnchorElement>("#guard-cta-link");
  const summary = cta.querySelector<HTMLElement>("#guard-cta-summary");
  const heading = cta.querySelector("h2");
  const eyebrow = cta.querySelector(".step");

  if (eyebrow) eyebrow.textContent = "PAYMENT VERIFIED";
  if (heading) heading.textContent = "Get paid the same way";
  if (summary) {
    summary.textContent =
      "Your payment matched the request. Create your own Guard Link with your wallet prefilled, then share it in chat or as a QR code.";
  }
  if (link) {
    const url = new URL("/guard/create", location.origin);
    url.searchParams.set("recipient", payerAddress);
    url.searchParams.set("from", "verified-payment");
    link.href = url.toString();
    link.textContent = "Create your Guard Link";
  }
  cta.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function connected(): void {
  const state = wallet?.getState?.() || { account: "" };
  account = state.account || "";
  const declared = (root?.dataset.payer || "").toLowerCase();
  const matches = Boolean(declared && account.toLowerCase() === declared);
  if (!send || !status) return;
  send.disabled = !(root?.dataset.decision === "ALLOW" && matches);
  status.textContent = matches
    ? send.disabled
      ? "The connected wallet matches, but this intent is not allowed to proceed."
      : "Wallet matched. Review the exact testnet transaction before signing."
    : "The connected wallet does not match the declared payer.";
}

connect?.addEventListener("click", async () => {
  if (!wallet) {
    show("review", "Wallet module did not load. Refresh and try again.");
    return;
  }
  connect.disabled = true;
  try {
    await wallet.connect();
    await wallet.ensureChain(ARC_TESTNET);
    const state = wallet.getState();
    account = state.account;
    const declared = root?.dataset.payer || "";
    if (!declared || declared.toLowerCase() !== account.toLowerCase()) {
      const url = new URL(location.href);
      url.searchParams.set("payer", account);
      location.replace(url.toString());
      return;
    }
    connected();
  } catch (error) {
    show(
      "error",
      error instanceof Error ? error.message : "Wallet connection failed.",
    );
  } finally {
    connect.disabled = false;
  }
});

send?.addEventListener("click", async () => {
  const provider = wallet?.getProvider();
  if (!provider || !account || root?.dataset.decision !== "ALLOW") return;
  if (
    !confirm(
      `Continue to your wallet to review a ${root.dataset.amount} test USDC transfer?`,
    )
  ) {
    return;
  }
  send.disabled = true;
  try {
    await wallet!.ensureChain(ARC_TESTNET);
    const rawProvider = provider as {
      request: (input: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    txHash = String(
      await rawProvider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: usdc,
            data: transferData(),
            value: "0x0",
          },
        ],
      }),
    );
    show(
      "review",
      "Transaction submitted. Wait for confirmation, then verify the onchain result.",
    );
    const link = document.createElement("a");
    link.href = `https://testnet.arcscan.app/tx/${txHash}`;
    link.rel = "noreferrer";
    link.target = "_blank";
    link.textContent = "Open transaction in ArcScan";
    output?.append(link);
    if (verify) verify.hidden = false;
  } catch (error) {
    show(
      "error",
      error instanceof Error
        ? error.message
        : "The wallet rejected or failed the transaction.",
    );
    send.disabled = false;
  }
});

verify?.addEventListener("click", async () => {
  if (!txHash) return;
  verify.disabled = true;
  show(
    "neutral",
    "Checking the confirmed transaction against the original intent…",
  );
  try {
    const response = await fetch("/v1/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        network: "arcTestnet",
        txHash,
        intent: {
          action: "transfer",
          expectedDebitAddress: account,
          expectedRecipient: root?.dataset.recipient,
          expectedAssetAddress: usdc,
          expectedAmountMicroUsdc: units(root!.dataset.amount!),
          purpose: root?.dataset.purpose,
        },
      }),
    });
    const body = (await response.json()) as { status?: string; message?: string; error?: string };
    if (response.status === 404) {
      show("review", "The transaction is not confirmed yet. Wait a moment and verify again.");
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
    show(
      kind,
      `${body.status}: ${
        body.status === "VERIFIED"
          ? "The confirmed asset flow matches the declared payment."
          : "Review the evidence before treating this payment as complete."
      }`,
    );
    if (body.status === "VERIFIED" && account) {
      activateVerifiedCta(account);
    }
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(body, null, 2);
    output?.append(pre);
  } catch (error) {
    show(
      "error",
      error instanceof Error ? error.message : "Evidence check failed.",
    );
  } finally {
    verify.disabled = false;
  }
});

if (!wallet) {
  if (connect) connect.disabled = true;
  if (status) {
    status.textContent =
      "Wallet support did not load. Intent review remains available.";
  }
} else if (root?.dataset.payer) {
  if (status) {
    status.textContent =
      "Reconnect the declared test wallet to enable the payment button.";
  }
  void wallet.restore().then(() => connected()).catch(() => {});
}

if (root?.dataset.decision === "BLOCK") {
  if (connect) connect.disabled = true;
  if (status) status.textContent = "This payment is blocked. Wallet handoff is disabled.";
}
