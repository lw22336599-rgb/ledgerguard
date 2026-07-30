import { getSharedWallet } from "./wallet-shared.js";
import { ARC_TESTNET } from "./wallet-chains.js";

const wallet = () => getSharedWallet();
const button = document.querySelector<HTMLButtonElement>("#w-btn");
const status = document.querySelector<HTMLElement>("#w-status");
const detail = document.querySelector<HTMLElement>("#w-detail");
const dot = document.querySelector<HTMLElement>("#w-dot");
const section = document.querySelector<HTMLElement>("#wallet-section");
const recipientInput = document.querySelector<HTMLInputElement>("#guard-recipient");

function render(): void {
  const state = wallet().getState();
  if (!button || !status || !dot || !section) return;

  if (state.connected) {
    status.textContent = `Connected: ${wallet().shortAddress(state.account)}`;
    button.textContent = "Disconnect";
    button.classList.add("w-connected");
    dot.style.background = "#4ade80";
    section.classList.add("wallet-connected");
    if (detail) {
      detail.hidden = false;
      detail.textContent = `Wallet: ${state.account}${
        state.chainId
          ? ` | Chain: eip155:${Number.parseInt(state.chainId, 16)}`
          : ""
      }`;
    }
    if (
      recipientInput &&
      (!recipientInput.value ||
        recipientInput.value === "0x2222222222222222222222222222222222222222")
    ) {
      recipientInput.value = state.account;
    }
  } else {
    status.textContent = "No wallet connected";
    button.textContent = "Connect Wallet";
    button.classList.remove("w-connected");
    dot.style.background = "#555";
    section.classList.remove("wallet-connected");
    if (detail) detail.hidden = true;
  }
}

wallet().subscribe(render);
void wallet().restore().finally(render);

button?.addEventListener("click", async () => {
  if (!button) return;
  button.disabled = true;
  try {
    if (wallet().getState().connected) {
      wallet().disconnect();
      return;
    }
    await wallet().connect();
    try {
      await wallet().ensureChain(ARC_TESTNET);
    } catch {
      // Arc Testnet is optional on the builder page.
    }
  } catch (error) {
    if (status) {
      status.textContent =
        error instanceof Error ? error.message : "Connection cancelled";
    }
  } finally {
    button.disabled = false;
  }
});
