import {
  createPublicClient,
  defineChain,
  fallback,
  http,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { arcTestnet } from "viem/chains";
import {
  requireEnabledNetwork,
  type NetworkName,
} from "../config/networks.js";

export function createNetworkClient(name: NetworkName): PublicClient {
  const network = requireEnabledNetwork(name);
  const chain =
    name === "arcTestnet"
      ? arcTestnet
      : defineChain({
          id: network.chainId!,
          name: network.displayName,
          nativeCurrency: {
            name: "USDC",
            symbol: "USDC",
            decimals: 18,
          },
          rpcUrls: {
            default: { http: [...network.rpcUrls] },
          },
          blockExplorers: network.explorerUrl
            ? {
                default: {
                  name: "Arc Explorer",
                  url: network.explorerUrl,
                },
              }
            : undefined,
        });

  return createPublicClient({
    chain,
    transport: fallback(
      network.rpcUrls.map((url) =>
        http(url, {
          timeout: 8_000,
          retryCount: 1,
        }),
      ),
      { rank: true },
    ),
  });
}

export interface SimulationRequest {
  from?: Address;
  to: Address;
  data: Hex;
  value: bigint;
}

export interface SimulationResult {
  status: "success" | "failed" | "not_run";
  error?: string;
}

export async function withDeadline<T>(
  operation: Promise<T>,
  timeoutMs = 10_000,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`RPC deadline exceeded after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function probeRpc(
  rpcUrls: readonly string[],
  timeoutMs = 6_000,
): Promise<{ chainId: number; blockNumber: bigint; rpcUrl: string }> {
  const errors: string[] = [];

  for (const rpcUrl of rpcUrls) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify([
          { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] },
          { jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] },
        ]),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as Array<{
        id: number;
        result?: string;
        error?: { message?: string };
      }>;
      const chainIdResult = payload.find((item) => item.id === 1);
      const blockResult = payload.find((item) => item.id === 2);
      if (!chainIdResult?.result || !blockResult?.result) {
        throw new Error(
          chainIdResult?.error?.message ??
            blockResult?.error?.message ??
            "Incomplete JSON-RPC response",
        );
      }
      return {
        chainId: Number(BigInt(chainIdResult.result)),
        blockNumber: BigInt(blockResult.result),
        rpcUrl,
      };
    } catch (error) {
      errors.push(
        `${new URL(rpcUrl).host}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  throw new Error(`All configured RPC endpoints failed: ${errors.join("; ")}`);
}

export async function simulateReadOnly(
  client: PublicClient,
  request: SimulationRequest,
): Promise<SimulationResult> {
  if (!request.from) {
    return {
      status: "not_run",
      error: "A sender address is required for reliable simulation.",
    };
  }

  try {
    await withDeadline(
      client.call({
        account: request.from,
        to: request.to,
        data: request.data,
        value: request.value,
      }),
    );
    return { status: "success" };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message.slice(0, 500) : "RPC simulation failed",
    };
  }
}
