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
  targetHasCode?: boolean;
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

export interface RpcShadowObservation {
  host: string;
  ok: boolean;
  chainId: number | null;
  blockNumber: bigint | null;
  contractCode: Record<string, string | null>;
  error: string | null;
}

export interface RpcShadowConsensus {
  ok: boolean;
  expectedChainId: number;
  healthyRpcs: number;
  requiredHealthyRpcs: number;
  headBlock: bigint | null;
  blockLag: bigint | null;
  maximumBlockLag: number;
  contractsConsistent: boolean;
  observations: RpcShadowObservation[];
  failures: string[];
}

export interface NetworkObserverResult {
  host: string;
  ok: boolean;
  chainId: number | null;
  blockNumber: bigint | null;
  error: string | null;
}

export async function probeNetworkObservers(
  urls: readonly string[],
  timeoutMs = 8_000,
): Promise<NetworkObserverResult[]> {
  return Promise.all(
    urls.map(async (url) => {
      const host = new URL(url).host;
      try {
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as {
          components?: {
            monitor?: {
              health?: string;
              details?: {
                chainID?: number;
                block?: { number?: number; status?: string };
              };
            };
          };
        };
        const monitor = payload.components?.monitor;
        const chainId = monitor?.details?.chainID;
        const blockNumber = monitor?.details?.block?.number;
        if (
          monitor?.health !== "UP" ||
          monitor.details?.block?.status !== "VALIDATED" ||
          !Number.isSafeInteger(chainId) ||
          !Number.isSafeInteger(blockNumber)
        ) {
          throw new Error("Incomplete observer response");
        }
        return {
          host,
          ok: true,
          chainId: chainId!,
          blockNumber: BigInt(blockNumber!),
          error: null,
        };
      } catch (error) {
        return {
          host,
          ok: false,
          chainId: null,
          blockNumber: null,
          error:
            error instanceof Error
              ? error.message.slice(0, 300)
              : "Unknown error",
        };
      }
    }),
  );
}

async function probeShadowEndpoint(
  rpcUrl: string,
  contracts: readonly { label: string; address: Address }[],
  timeoutMs: number,
): Promise<RpcShadowObservation> {
  const host = new URL(rpcUrl).host;
  const requests = [
    { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] },
    { jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] },
    ...contracts.map(({ address }, index) => ({
      jsonrpc: "2.0",
      id: index + 3,
      method: "eth_getCode",
      params: [address, "latest"],
    })),
  ];

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requests),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as Array<{
      id: number;
      result?: string;
      error?: { message?: string };
    }>;
    const byId = new Map(payload.map((item) => [item.id, item]));
    const chainResult = byId.get(1);
    const blockResult = byId.get(2);
    if (!chainResult?.result || !blockResult?.result) {
      throw new Error(
        chainResult?.error?.message ??
          blockResult?.error?.message ??
          "Incomplete JSON-RPC response",
      );
    }
    const contractCode = Object.fromEntries(
      contracts.map(({ label }, index) => {
        const result = byId.get(index + 3)?.result;
        return [label, result && result !== "0x" ? result.toLowerCase() : null];
      }),
    );
    return {
      host,
      ok: true,
      chainId: Number(BigInt(chainResult.result)),
      blockNumber: BigInt(blockResult.result),
      contractCode,
      error: null,
    };
  } catch (error) {
    return {
      host,
      ok: false,
      chainId: null,
      blockNumber: null,
      contractCode: {},
      error:
        error instanceof Error
          ? error.message.slice(0, 300)
          : "Unknown error",
    };
  }
}

export async function probeRpcConsensus(input: {
  rpcUrls: readonly string[];
  expectedChainId: number;
  minimumHealthyRpcs: number;
  maximumBlockLag: number;
  contracts: readonly { label: string; address: Address }[];
  timeoutMs?: number;
}): Promise<RpcShadowConsensus> {
  const observations = await Promise.all(
    input.rpcUrls.map((rpcUrl) =>
      probeShadowEndpoint(rpcUrl, input.contracts, input.timeoutMs ?? 8_000),
    ),
  );
  const healthy = observations.filter(
    (observation) =>
      observation.ok && observation.chainId === input.expectedChainId,
  );
  const blocks = healthy
    .map((observation) => observation.blockNumber)
    .filter((value): value is bigint => value !== null);
  const headBlock =
    blocks.length > 0
      ? blocks.reduce((a, b) => (a > b ? a : b))
      : null;
  const oldestBlock =
    blocks.length > 0 ? blocks.reduce((a, b) => (a < b ? a : b)) : null;
  const blockLag =
    headBlock !== null && oldestBlock !== null ? headBlock - oldestBlock : null;
  const contractsConsistent = input.contracts.every(({ label }) => {
    const values = healthy
      .map((observation) => observation.contractCode[label])
      .filter((value): value is string => Boolean(value));
    return (
      values.length === healthy.length &&
      values.length >= input.minimumHealthyRpcs &&
      new Set(values).size === 1
    );
  });
  const failures: string[] = [];
  for (const observation of observations) {
    if (!observation.ok) {
      failures.push(`${observation.host}: unavailable`);
    } else if (observation.chainId !== input.expectedChainId) {
      failures.push(
        `${observation.host}: chain ID ${observation.chainId ?? "unknown"}`,
      );
    }
  }
  if (healthy.length < input.minimumHealthyRpcs) {
    failures.push(
      `Only ${healthy.length}/${input.minimumHealthyRpcs} required RPC endpoints agree.`,
    );
  }
  if (blockLag === null || blockLag > BigInt(input.maximumBlockLag)) {
    failures.push(
      `RPC head divergence exceeds ${input.maximumBlockLag} blocks.`,
    );
  }
  if (!contractsConsistent) {
    failures.push("Critical contract bytecode is missing or inconsistent.");
  }

  return {
    ok: failures.length === 0,
    expectedChainId: input.expectedChainId,
    healthyRpcs: healthy.length,
    requiredHealthyRpcs: input.minimumHealthyRpcs,
    headBlock,
    blockLag,
    maximumBlockLag: input.maximumBlockLag,
    contractsConsistent,
    observations,
    failures,
  };
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
    const [, bytecode] = await withDeadline(
      Promise.all([
        client.call({
          account: request.from,
          to: request.to,
          data: request.data,
          value: request.value,
        }),
        client.getBytecode({ address: request.to }),
      ]),
    );
    return {
      status: "success",
      targetHasCode: Boolean(bytecode && bytecode !== "0x"),
    };
  } catch (error) {
    console.error("Read-only RPC simulation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    });
    return {
      status: "failed",
      error: "Read-only RPC simulation failed.",
    };
  }
}
