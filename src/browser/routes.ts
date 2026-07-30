import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import {
  BASE_SEPOLIA,
  BASE_SEPOLIA_USDC,
} from "./wallet-chains.js";
import { getSharedWallet } from "./wallet-shared.js";

const wallet = () => getSharedWallet();

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
const readiness = document.querySelector<HTMLElement>("#route-readiness")!;
const quoteOutput = document.querySelector<HTMLElement>("#route-quote-output")!;
const progressOutput =
  document.querySelector<HTMLElement>("#route-progress-output")!;

const maxAmount = Number(root.dataset.maxAmount ?? "0.001");
const customFee = root.dataset.customFee ?? "0";
const feeRecipient = root.dataset.feeRecipient ?? "";
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

const BASE_SEPOLIA_CHAIN_ID = Number.parseInt(BASE_SEPOLIA.chainId, 16);

function chainLabel(chainNumeric: number | null): string {
  if (chainNumeric === 8453) return "Base Mainnet (8453)";
  if (chainNumeric === BASE_SEPOLIA_CHAIN_ID) return "Base Sepolia (84532)";
  if (chainNumeric === 5042002) return "Arc Testnet (5042002)";
  return chainNumeric ? `chain ${chainNumeric}` : "unknown chain";
}

readiness.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === "route-switch-network") {
    target.setAttribute("disabled", "true");
    try {
      await wallet().ensureChain(BASE_SEPOLIA);
      await updateReadiness();
    } catch (error) {
      show(
        progressOutput,
        "error",
        error instanceof Error ? error.message : "Network switch was rejected.",
      );
    } finally {
      target.removeAttribute("disabled");
    }
  }
});

async function updateReadiness(): Promise<void> {
  if (!readiness) return;
  const state = wallet().getState();
  if (!state.connected) {
    readiness.className = "route-readiness neutral";
    readiness.innerHTML = `<strong>Step 1: Connect wallet</strong>
      <p>Click <strong>Connect wallet</strong> below. If MetaMask opens, choose your account and click <strong>Connect</strong>.</p>
      <p class="route-help">Need test funds later? Use the <a id="route-open-faucet" href="https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet" rel="noreferrer" target="_blank">Base Sepolia faucet</a> after switching network.</p>`;
    quoteButton.disabled = true;
    executeButton.disabled = true;
    return;
  }

  const chainNumeric = state.chainId
    ? Number.parseInt(state.chainId, 16)
    : null;
  const onBaseSepolia = chainNumeric === BASE_SEPOLIA_CHAIN_ID;
  let balanceMicro = 0n;
  let balanceText = "0";
  try {
    if (onBaseSepolia) {
      balanceMicro = await wallet().readErc20Balance(BASE_SEPOLIA_USDC);
      balanceText = wallet().formatUsdc(balanceMicro);
    }
  } catch {
    balanceText = "could not read";
  }

  if (!onBaseSepolia) {
    readiness.className = "route-readiness review";
    readiness.innerHTML = `<strong>Step 2: Switch network</strong>
      <p>Wallet ${wallet().shortAddress(state.account)} is on <strong>${chainLabel(chainNumeric)}</strong>. This route requires <strong>Base Sepolia (84532)</strong>.</p>
      <p><button id="route-switch-network" type="button" class="route-action-btn">Switch to Base Sepolia</button></p>
      <p class="route-help">MetaMask will open. Click <strong>Approve</strong> or <strong>Switch network</strong>.</p>`;
    quoteButton.disabled = true;
    executeButton.disabled = true;
    return;
  }

  if (balanceMicro <= 0n) {
    readiness.className = "route-readiness review";
    readiness.innerHTML = `<strong>Step 3: Get test USDC</strong>
      <p>You are on Base Sepolia, but this wallet has <strong>0 test USDC</strong>.</p>
      <p><a id="route-open-faucet" class="route-action-link" href="https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet" rel="noreferrer" target="_blank">Open Base Sepolia faucet</a></p>
      <p class="route-help">Claim test USDC, wait ~30 seconds, then refresh this page and click <strong>Get protected quote</strong>.</p>`;
    quoteButton.disabled = true;
    executeButton.disabled = true;
    return;
  }

  readiness.className = "route-readiness allow";
  readiness.innerHTML = `<strong>Ready</strong>
    <p>Wallet ${wallet().shortAddress(state.account)} is on Base Sepolia with <strong>${balanceText} test USDC</strong>.</p>
    <p class="route-help">Next: click <strong>Get protected quote</strong>, then <strong>Review and execute</strong>, and approve each MetaMask popup.</p>`;
  quoteButton.disabled = false;
}

wallet().subscribe(async (state) => {
  if (state.connected && state.provider) {
    adapter = await createViemAdapterFromProvider({ provider: state.provider });
    walletLabel.textContent = wallet().shortAddress(state.account);
    recipientInput.value ||= state.account;
    status.textContent =
      "Connected. Quoting is read-only; execution always requires explicit browser-wallet signatures.";
  } else {
    adapter = undefined;
    walletLabel.textContent = "not connected";
    status.textContent =
      "The quote is read-only. Execution requires explicit browser-wallet signatures.";
    quoteButton.disabled = true;
    executeButton.disabled = true;
  }
  await updateReadiness();
});

void wallet().restore().then(async (state) => {
  if (state?.connected && state.provider) {
    adapter = await createViemAdapterFromProvider({ provider: state.provider });
    walletLabel.textContent = wallet().shortAddress(state.account);
    recipientInput.value ||= state.account;
  }
  await updateReadiness();
});

connectButton.addEventListener("click", async () => {
  connectButton.disabled = true;
  try {
    if (wallet().getState().connected) {
      wallet().disconnect();
      quotedAmount = "";
      quoteOutput.hidden = true;
      progressOutput.hidden = true;
      return;
    }
    await wallet().connect();
    await wallet().ensureChain(BASE_SEPOLIA);
  } catch (error) {
    show(
      progressOutput,
      "error",
      error instanceof Error ? error.message : "Wallet connection failed.",
    );
  } finally {
    connectButton.disabled = false;
    await updateReadiness();
  }
});

quoteButton.addEventListener("click", async () => {
  quoteButton.disabled = true;
  executeButton.disabled = true;
  quotedAmount = "";
  try {
    await wallet().ensureChain(BASE_SEPOLIA);
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
    await updateReadiness();
  }
});

executeButton.addEventListener("click", async () => {
  if (!adapter) return;
  let params;
  try {
    await wallet().ensureChain(BASE_SEPOLIA);
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

amountInput.addEventListener("input", () => {
  executeButton.disabled = true;
});
recipientInput.addEventListener("input", () => {
  executeButton.disabled = true;
});
