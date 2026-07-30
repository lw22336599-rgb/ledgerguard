export function getSharedWallet() {
  const wallet = window.LedgerGuardWallet;
  if (!wallet) {
    throw new Error("Wallet module did not load.");
  }
  return wallet;
}

declare global {
  interface Window {
    LedgerGuardWallet?: import("./wallet-core.js").WalletCore;
  }
}
