import { WalletNotFoundError } from "./wallet-core.js";

export function isNoWalletError(error: unknown): boolean {
  return (
    error instanceof WalletNotFoundError ||
    (error instanceof Error &&
      /no wallet found|no browser wallet detected/i.test(error.message))
  );
}

export function showNoWalletHelp(): void {
  if (document.querySelector(".wallet-help-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "wallet-picker-overlay wallet-help-overlay";
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("section");
  dialog.className = "wallet-picker-dialog wallet-help-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "wallet-help-title");

  const title = document.createElement("h2");
  title.id = "wallet-help-title";
  title.textContent = "Install a wallet first";

  const lead = document.createElement("p");
  lead.className = "wallet-picker-lead";
  lead.textContent =
    "LedgerGuard never holds your keys. To connect, install an EVM wallet such as MetaMask, then return here.";

  const steps = document.createElement("ol");
  steps.className = "wallet-help-steps";
  steps.innerHTML = `
    <li>Install <a href="https://metamask.io/download/" rel="noreferrer" target="_blank">MetaMask</a> (or another EVM wallet).</li>
    <li>Refresh this page and click <strong>Connect Wallet</strong> again.</li>
    <li>For Guard Links, fund Arc Testnet USDC using the <a href="/testnet-help#arc">wallet setup guide</a>.</li>
  `;

  const actions = document.createElement("div");
  actions.className = "wallet-buttons";

  const guide = document.createElement("a");
  guide.className = "button-link";
  guide.href = "/testnet-help#arc";
  guide.textContent = "Open wallet setup guide";

  const close = document.createElement("button");
  close.type = "button";
  close.className = "wallet-picker-cancel secondary";
  close.textContent = "Close";

  const cleanup = () => {
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") cleanup();
  };

  close.addEventListener("click", cleanup);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) cleanup();
  });

  actions.append(guide, close);
  dialog.append(title, lead, steps, actions);
  overlay.append(dialog);
  document.body.append(overlay);
  document.addEventListener("keydown", onKeyDown);
  close.focus();
}

export async function handleWalletConnectError(error: unknown): Promise<void> {
  if (isNoWalletError(error)) {
    showNoWalletHelp();
    return;
  }
  window.alert(
    error instanceof Error ? error.message : "Wallet connection failed.",
  );
}
