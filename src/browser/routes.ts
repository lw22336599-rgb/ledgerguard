import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { EIP1193Provider } from "viem";

type ProviderDetail = {
  info: { name: string; uuid: string };
  provider: EIP1193Provider;
};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const root = document.querySelector<HTMLElement>("#route-app");
if (!root) throw new Error("Route application root is missing.");

const connectButton = document.querySelector<HTMLButtonElement>("#route-connect")!;
const quoteButton = document.querySelector<HTMLButtonElement>("#route-quote")!;
const executeButton = document.querySelector<HTMLButtonElement>("#route-execute")!;
const amountInput = document.querySelector<HTMLInputElement>("#route-amount")!;
const recipientInput =
  document.querySelector<HTMLInputElement>("#route-recipient")!;
const walletLabel = document.querySelector<HTMLElement>("#route-wallet")!;
const status = document.querySelector<HTMLElement>("#route-status")!;
const quoteOutput = document.querySelector<HTMLElement>("#route-quote-output")!;
const progressOutput =
  document.querySelector<HTMLElement>("#route-progress-output")!;

const maxAmount = Number(root.dataset.maxAmount ?? "0.001");
const customFee = root.dataset.customFee ?? "0";
const feeRecipient = root.dataset.feeRecipient ?? "";
const providers = new Map<string, ProviderDetail>();
let provider: EIP1193Provider | undefined;
let account = "";
let adapter: Awaited<ReturnType<typeof createViemAdapterFromProvider>> | undefined;
let quotedAmount = "";

const show = (element: HTMLElement, kind: string, message: string) => {
  element.hidden = false;
  element.className = `result ${kind}`;
  element.textContent = message;
};

const safeAmount = () => {
  const value = amountInput.value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) {
    throw new Error("Enter a USDC amount with no more than six decimals.");
  }
  const numeric = Number(value);
  if (!(numeric > 0) || numeric > maxAmount) {
    throw new Error(`This test route is capped at ${maxAmount} USDC.`);
  }
  return value;
};

const safeRecipient = () => {
  const value = recipientInput.value.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error("Enter a valid destination EVM address.");
  }
  return value;
};

const bridgeParams = () => {
  if (!adapter) throw new Error("Connect a browser wallet first.");
  const amount = safeAmount();
  const recipientAddress = safeRecipient();
  return {
    from: { adapter, chain: "Base_Sepolia" as const },
    to: { adapter, chain: "Arc_Testnet" as const, recipientAddress },
    amount,
    token: "USDC" as const,
    config: {
      transferSpeed: "SLOW" as const,
      batchTransactions: false,
      maxFee: "0",
      ...(customFee !== "0" && feeRecipient
        ? { customFee: { value: customFee, recipientAddress: feeRecipient } }
        : {}),
    },
    invocationMeta: {
      traceId: crypto.randomUUID().replaceAll("-", ""),
      callers: [{ type: "app" as const, name: "LedgerGuard Routes", version: "0.1.0" }],
    },
  };
};

window.addEventListener("eip6963:announceProvider", (event) => {
  const detail = (event as CustomEvent<ProviderDetail>).detail;
  providers.set(detail.info.uuid, detail);
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

connectButton.addEventListener("click", async () => {
  connectButton.disabled = true;
  try {
    provider = providers.values().next().value?.provider ?? window.ethereum;
    if (!provider) throw new Error("No EIP-6963 or injected EVM wallet was found.");
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    account = accounts[0] ?? "";
    if (!/^0x[0-9a-fA-F]{40}$/.test(account)) {
      throw new Error("The wallet did not return a valid account.");
    }
    adapter = await createViemAdapterFromProvider({ provider });
    recipientInput.value ||= account;
    walletLabel.textContent = `${account.slice(0, 8)}…${account.slice(-6)}`;
    status.textContent =
      "Connected. Quoting is read-only; execution always requires explicit wallet signatures.";
    quoteButton.disabled = false;
  } catch (error) {
    show(
      progressOutput,
      "error",
      error instanceof Error ? error.message : "Wallet connection failed.",
    );
  } finally {
    connectButton.disabled = false;
  }
});

quoteButton.addEventListener("click", async () => {
  quoteButton.disabled = true;
  executeButton.disabled = true;
  quotedAmount = "";
  try {
    const params = bridgeParams();
    show(quoteOutput, "neutral", "Reading the route and estimating costs…");
    const kit = new AppKit({
      disableAnalytics: true,
      disableErrorReporting: true,
    });
    const estimate = await kit.estimateBridge(params);
    const protocolFees = estimate.fees.map((fee) => ({
      type: fee.type,
      token: fee.token,
      amount: fee.amount,
      available: !fee.error,
    }));
    const gasFees = estimate.gasFees.map((fee) => ({
      step: fee.name,
      token: fee.token,
      chain: fee.blockchain,
      available: Boolean(fee.fees) && !fee.error,
    }));
    quotedAmount = params.amount;
    quoteOutput.className = "result allow";
    quoteOutput.replaceChildren();
    const summary = document.createElement("p");
    summary.textContent = `Quote ready: ${params.amount} USDC from Base Sepolia to Arc Testnet; LedgerGuard fee ${customFee} test USDC; CCTP standard transfer max protocol fee 0 USDC.`;
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify({ protocolFees, gasFees }, null, 2);
    quoteOutput.append(summary, pre);
    executeButton.disabled = false;
  } catch (error) {
    show(
      quoteOutput,
      "error",
      error instanceof Error ? error.message : "Quote failed closed.",
    );
  } finally {
    quoteButton.disabled = false;
  }
});

executeButton.addEventListener("click", async () => {
  if (!adapter || !provider) return;
  let params;
  try {
    params = bridgeParams();
    if (params.amount !== quotedAmount) {
      throw new Error("The amount changed after the quote. Request a new quote.");
    }
  } catch (error) {
    show(
      progressOutput,
      "error",
      error instanceof Error ? error.message : "The quoted intent changed.",
    );
    return;
  }
  const total = (Number(params.amount) + Number(customFee)).toFixed(6);
  if (
    !confirm(
      `Proceed to wallet review?\n\nBridge: ${params.amount} test USDC\nLedgerGuard fee: ${customFee} test USDC\nMaximum token debit: ${total} test USDC\n\nYour wallet controls every signature.`,
    )
  ) {
    return;
  }
  executeButton.disabled = true;
  try {
    show(
      progressOutput,
      "review",
      "Waiting for wallet approval, burn, Circle attestation, and destination mint…",
    );
    const kit = new AppKit({
      disableAnalytics: true,
      disableErrorReporting: true,
    });
    const result = await kit.bridge(params);
    const steps = result.steps.map((step) => ({
      name: step.name,
      state: step.state,
      txHash: step.txHash ?? null,
      explorerUrl: step.explorerUrl ?? null,
      forwarded: step.forwarded ?? null,
      errorCategory: step.errorCategory ?? null,
    }));
    const burn = result.steps.find((step) =>
      step.name.toLowerCase().includes("burn"),
    );
    progressOutput.className =
      result.state === "success" ? "result allow" : "result review";
    progressOutput.replaceChildren();
    const summary = document.createElement("p");
    summary.textContent = `App Kit result: ${result.state}. LedgerGuard will only call it verified after the CCTP evidence endpoint confirms attestation and destination mint.`;
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(steps, null, 2);
    progressOutput.append(summary, pre);
    if (burn?.txHash) {
      const response = await fetch("/v1/cctp/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceTxHash: burn.txHash,
          recipient: safeRecipient(),
          amountMicroUsdc: (
            BigInt(params.amount.split(".")[0] || "0") * 1_000_000n +
            BigInt(((params.amount.split(".")[1] || "") + "000000").slice(0, 6))
          ).toString(),
          feeMicroUsdc: (
            BigInt(customFee.split(".")[0] || "0") * 1_000_000n +
            BigInt(((customFee.split(".")[1] || "") + "000000").slice(0, 6))
          ).toString(),
        }),
      });
      const evidence = await response.json();
      const evidencePre = document.createElement("pre");
      evidencePre.textContent = JSON.stringify(evidence, null, 2);
      progressOutput.append(evidencePre);
      if (response.ok && evidence.status === "VERIFIED") {
        progressOutput.className = "result allow";
      } else {
        progressOutput.className = "result review";
      }
    }
  } catch (error) {
    show(
      progressOutput,
      "error",
      error instanceof Error
        ? error.message
        : "The bridge stopped before verified completion.",
    );
  } finally {
    executeButton.disabled = false;
  }
});
