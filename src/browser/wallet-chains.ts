import type { ChainDefinition } from "./wallet-core.js";

export const BASE_MAINNET: ChainDefinition = {
  chainId: "0x2105",
  chainName: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

export const BASE_SEPOLIA: ChainDefinition = {
  chainId: "0x14a34",
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const ARC_TESTNET: ChainDefinition = {
  chainId: "0x4cef52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634c792Dc1eC00166AEAcF62";

export const ARC_TESTNET_USDC =
  "0x3600000000000000000000000000000000000000";
