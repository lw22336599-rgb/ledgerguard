import type { EIP1193Provider } from "viem";

export type ProviderDetail = {
  info: { name: string; uuid: string; icon?: string };
  provider: EIP1193Provider;
};

export type ChainDefinition = {
  chainId: `0x${string}`;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

const STORAGE_KEY = "ledgerguard.wallet.session";

type WalletSession = {
  account: string;
  chainId: string;
  providerUuid: string | null;
};

export class WalletCore {
  private providers = new Map<string, ProviderDetail>();
  private activeProvider: EIP1193Provider | undefined;
  private activeUuid: string | null = null;
  private account = "";
  private chainId = "";
  private listeners = new Set<(state: WalletState) => void>();

  constructor() {
    window.addEventListener("eip6963:announceProvider", (event) => {
      const detail = (event as CustomEvent<ProviderDetail>).detail;
      this.providers.set(detail.info.uuid, detail);
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): WalletState {
    return {
      account: this.account,
      chainId: this.chainId,
      connected: Boolean(this.account),
      provider: this.activeProvider,
      providerName: this.activeUuid
        ? (this.providers.get(this.activeUuid)?.info.name ?? "Wallet")
        : null,
    };
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  private persist(): void {
    if (!this.account) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: WalletSession = {
      account: this.account,
      chainId: this.chainId,
      providerUuid: this.activeUuid,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private pickProvider(preferredUuid?: string | null): EIP1193Provider {
    if (preferredUuid) {
      const preferred = this.providers.get(preferredUuid)?.provider;
      if (preferred) return preferred;
    }
    const discovered = [...this.providers.values()];
    if (discovered.length === 1) {
      this.activeUuid = discovered[0]!.info.uuid;
      return discovered[0]!.provider;
    }
    if (discovered.length > 1) {
      const names = discovered.map((entry, index) => `${index + 1}. ${entry.info.name}`);
      const choice = window.prompt(
        `Select a wallet:\n${names.join("\n")}\n\nEnter the number:`,
      );
      const index = choice ? Number.parseInt(choice, 10) - 1 : -1;
      if (index >= 0 && discovered[index]) {
        this.activeUuid = discovered[index]!.info.uuid;
        return discovered[index]!.provider;
      }
    }
    if (window.ethereum) {
      this.activeUuid = null;
      return window.ethereum;
    }
    throw new Error("No EIP-6963 or injected EVM wallet was found.");
  }

  async connect(preferredUuid?: string | null): Promise<WalletState> {
    const provider = this.pickProvider(preferredUuid);
    const accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
    const account = accounts[0] ?? "";
    if (!/^0x[0-9a-fA-F]{40}$/.test(account)) {
      throw new Error("The wallet did not return a valid account.");
    }
    const chainId = (await provider.request({ method: "eth_chainId" })) as string;
    this.activeProvider = provider;
    this.account = account;
    this.chainId = chainId;
    this.persist();
    this.emit();
    return this.getState();
  }

  async restore(): Promise<WalletState | null> {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as WalletSession;
      const provider =
        (session.providerUuid
          ? this.providers.get(session.providerUuid)?.provider
          : undefined) ?? window.ethereum;
      if (!provider) return null;
      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as string[];
      const account = accounts.find(
        (value) => value.toLowerCase() === session.account.toLowerCase(),
      );
      if (!account) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      const chainId = (await provider.request({ method: "eth_chainId" })) as string;
      this.activeProvider = provider;
      this.activeUuid = session.providerUuid;
      this.account = account;
      this.chainId = chainId;
      this.emit();
      return this.getState();
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  disconnect(): void {
    this.activeProvider = undefined;
    this.activeUuid = null;
    this.account = "";
    this.chainId = "";
    sessionStorage.removeItem(STORAGE_KEY);
    this.emit();
  }

  getProvider(): EIP1193Provider | undefined {
    return this.activeProvider;
  }

  async ensureChain(definition: ChainDefinition): Promise<string> {
    const provider = this.activeProvider;
    if (!provider) throw new Error("Connect a browser wallet first.");
    const current = ((await provider.request({ method: "eth_chainId" })) as string).toLowerCase();
    if (current === definition.chainId.toLowerCase()) {
      this.chainId = current;
      this.persist();
      this.emit();
      return current;
    }
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: definition.chainId }],
      });
    } catch (error) {
      const walletError = error as { code?: number };
      if (walletError.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [definition],
        });
      } else {
        throw error;
      }
    }
    const chainId = (await provider.request({ method: "eth_chainId" })) as string;
    this.chainId = chainId;
    this.persist();
    this.emit();
    return chainId;
  }

  async readErc20Balance(tokenAddress: string): Promise<bigint> {
    const provider = this.activeProvider;
    if (!provider || !this.account) {
      throw new Error("Connect a browser wallet first.");
    }
    const data =
      "0x70a08231" +
      this.account.slice(2).toLowerCase().padStart(64, "0");
    const result = (await provider.request({
      method: "eth_call",
      params: [
        { to: tokenAddress as `0x${string}`, data: data as `0x${string}` },
        "latest",
      ],
    })) as string;
    return BigInt(result);
  }

  formatUsdc(micro: bigint): string {
    const whole = micro / 1_000_000n;
    const fraction = micro % 1_000_000n;
    return `${whole}.${fraction.toString().padStart(6, "0").replace(/0+$/, "") || "0"}`;
  }

  shortAddress(address: string): string {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
}

export type WalletState = {
  account: string;
  chainId: string;
  connected: boolean;
  provider: EIP1193Provider | undefined;
  providerName: string | null;
};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    LedgerGuardWallet?: WalletCore;
  }
}

export function installWalletCore(): WalletCore {
  if (!window.LedgerGuardWallet) {
    window.LedgerGuardWallet = new WalletCore();
  }
  return window.LedgerGuardWallet;
}
