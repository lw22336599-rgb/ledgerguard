import { BASE_SEPOLIA } from "./wallet-chains.js";
import { handleWalletConnectError } from "./wallet-help.js";

function bindNavWallet(): void {
  const button = document.querySelector<HTMLButtonElement>("#nav-connect");
  const display = document.querySelector<HTMLElement>("#nav-wallet-display");
  if (!button || !window.LedgerGuardWallet) return;

  const wallet = window.LedgerGuardWallet;

  const render = () => {
    const state = wallet.getState();
    if (state.connected) {
      button.textContent = wallet.shortAddress(state.account);
      button.classList.add("connected");
      if (display) {
        display.textContent = state.chainId
          ? `eip155:${Number.parseInt(state.chainId, 16)}`
          : "";
        display.style.display = "inline";
      }
    } else {
      button.textContent = "Connect Wallet";
      button.classList.remove("connected");
      if (display) display.style.display = "none";
    }
  };

  wallet.subscribe(render);
  void wallet.restore().finally(render);

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (wallet.getState().connected) {
        wallet.disconnect();
      } else {
        await wallet.connect();
        if (location.pathname === "/routes") {
          try {
            await wallet.ensureChain(BASE_SEPOLIA);
          } catch {
            // Routes page shows the one-click switch button if this is rejected.
          }
        }
      }
    } catch (error) {
      await handleWalletConnectError(error);
    } finally {
      button.disabled = false;
    }
  });
}

function bindMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>("#nav-menu-toggle");
  const panel = document.querySelector<HTMLElement>("#nav-mobile-panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

bindNavWallet();
bindMobileNav();
