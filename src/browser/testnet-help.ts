import { ARC_TESTNET, ARC_TESTNET_USDC } from "./wallet-chains.js";

const connect = document.querySelector<HTMLButtonElement>("#fund-connect");
const copy = document.querySelector<HTMLButtonElement>("#fund-copy");
const refresh = document.querySelector<HTMLButtonElement>("#fund-refresh");
const status = document.querySelector<HTMLElement>("#fund-status");
const dot = document.querySelector<HTMLElement>("#fund-dot");
const address = document.querySelector<HTMLElement>("#fund-address");
const arcBalances = document.querySelector<HTMLElement>("#fund-arc-balances");

const wallet = () => window.LedgerGuardWallet;

function fmtUsdc(micro: bigint): string {
  const whole = micro / 1_000_000n;
  const fraction = micro % 1_000_000n;
  return (
    whole.toString() +
    "." +
    fraction
      .toString()
      .padStart(6, "0")
      .replace(/0+$/, "")
      .replace(/\.$/, ".0")
  );
}

async function renderArcBalances(): Promise<void> {
  if (!arcBalances || !wallet()?.getState().connected) {
    if (arcBalances) {
      arcBalances.className = "route-readiness neutral";
      arcBalances.innerHTML =
        "<strong>Arc Testnet USDC</strong><p>Connect a wallet to read your Arc Testnet balance.</p>";
    }
    return;
  }

  try {
    await wallet()!.ensureChain(ARC_TESTNET);
    const usdcRaw = await wallet()!.readErc20Balance(ARC_TESTNET_USDC);
    const usdc = fmtUsdc(usdcRaw);
    const ready = usdcRaw > 0n;
    arcBalances.className = `route-readiness ${ready ? "allow" : "review"}`;
    arcBalances.innerHTML = `<strong>Arc Testnet USDC</strong><p>Balance: <strong>${usdc}</strong> test USDC</p><p>${
      ready
        ? "You can create or pay Guard Links on Arc Testnet."
        : "Request test USDC from the Circle faucet (select Arc Testnet), then refresh."
    }</p>`;
  } catch (error) {
    arcBalances.className = "route-readiness review";
    arcBalances.innerHTML = `<strong>Could not read Arc balance</strong><p>${
      error instanceof Error ? error.message : "Unknown error"
    }</p>`;
  }
}

function renderWallet(): void {
  if (!wallet()) return;
  const state = wallet()!.getState();
  if (state.connected) {
    if (status) status.textContent = "Connected";
    if (dot) dot.classList.add("connected");
    if (address) {
      address.hidden = false;
      address.textContent = state.account;
    }
    if (copy) copy.disabled = false;
    if (refresh) refresh.disabled = false;
    if (connect) connect.textContent = "Disconnect";
  } else {
    if (status) status.textContent = "Wallet not connected";
    if (dot) dot.classList.remove("connected");
    if (address) address.hidden = true;
    if (copy) copy.disabled = true;
    if (refresh) refresh.disabled = true;
    if (connect) connect.textContent = "Connect Wallet";
  }
  void renderArcBalances();
}

if (wallet()) {
  wallet()!.subscribe(() => renderWallet());
  void wallet()!
    .restore()
    .finally(() => renderWallet());
}

connect?.addEventListener("click", async () => {
  if (!connect || !wallet()) return;
  connect.disabled = true;
  try {
    if (wallet()!.getState().connected) {
      wallet()!.disconnect();
    } else {
      await wallet()!.connect();
    }
  } finally {
    connect.disabled = false;
  }
});

copy?.addEventListener("click", async () => {
  const value = wallet()?.getState().account;
  if (!value || !status) return;
  try {
    await navigator.clipboard.writeText(value);
    status.textContent = "Address copied";
  } catch {
    status.textContent = "Copy the address manually";
  }
});

refresh?.addEventListener("click", () => {
  void renderArcBalances();
});

if (location.hash.replace("#", "") === "arc") {
  document
    .getElementById("guide-arc")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
