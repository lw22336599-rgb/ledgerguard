import { getArcMainnetShadowConfiguration } from "../config/shadow.js";
import {
  probeNetworkObservers,
  probeRpcConsensus,
} from "../lib/rpc.js";

const CACHE_TTL_MS = 15_000;
const FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 60_000;

export interface PublicShadowStatus {
  ok: boolean;
  enabled: boolean;
  ready: boolean;
  mode: "read-only-shadow";
  releaseStage: "pre-ga-observed";
  realFundsEnabled: false;
  signingEnabled: false;
  x402MainnetEnabled: false;
  chainId: number;
  configFingerprint: string | null;
  requiredHealthyRpcs: number;
  healthyRpcs: number;
  requiredHealthyObservers: number;
  healthyObservers: number;
  headBlock: string | null;
  blockLag: string | null;
  maximumBlockLag: number;
  contractsConsistent: boolean;
  rpcHosts: Array<{
    host: string;
    healthy: boolean;
    chainId: number | null;
    blockNumber: string | null;
    criticalContractsPresent: boolean;
  }>;
  observerHosts: Array<{
    host: string;
    healthy: boolean;
    chainId: number | null;
    blockNumber: string | null;
  }>;
  failures: string[];
  checkedAt: string;
  cached: boolean;
  circuitOpen: boolean;
}

let cache:
  | { value: PublicShadowStatus; expiresAt: number }
  | undefined;
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function disabledStatus(
  reason: string,
  circuitOpen = false,
): PublicShadowStatus {
  const config = getArcMainnetShadowConfiguration();
  return {
    ok: false,
    enabled: config.enabled,
    ready: config.ready,
    mode: config.mode,
    releaseStage: config.releaseStage,
    realFundsEnabled: false,
    signingEnabled: false,
    x402MainnetEnabled: false,
    chainId: config.chainId,
    configFingerprint: config.configFingerprint,
    requiredHealthyRpcs: config.minimumHealthyRpcs,
    healthyRpcs: 0,
    requiredHealthyObservers: config.minimumHealthyObservers,
    healthyObservers: 0,
    headBlock: null,
    blockLag: null,
    maximumBlockLag: config.maximumBlockLag,
    contractsConsistent: false,
    rpcHosts: config.rpcHosts.map((host) => ({
      host,
      healthy: false,
      chainId: null,
      blockNumber: null,
      criticalContractsPresent: false,
    })),
    observerHosts: config.observerHosts.map((host) => ({
      host,
      healthy: false,
      chainId: null,
      blockNumber: null,
    })),
    failures: [reason],
    checkedAt: new Date().toISOString(),
    cached: false,
    circuitOpen,
  };
}

export async function getArcMainnetShadowStatus(
  force = false,
): Promise<PublicShadowStatus> {
  const config = getArcMainnetShadowConfiguration();
  if (!config.ready) {
    return disabledStatus(config.reason ?? "Shadow configuration is incomplete.");
  }
  if (!force && cache && cache.expiresAt > Date.now()) {
    return { ...cache.value, cached: true };
  }
  if (!force && circuitOpenUntil > Date.now()) {
    return disabledStatus(
      "Shadow circuit breaker is open after repeated consensus failures.",
      true,
    );
  }

  const [consensus, observers] = await Promise.all([
    probeRpcConsensus({
      rpcUrls: config.rpcUrls,
      expectedChainId: config.chainId,
      minimumHealthyRpcs: config.minimumHealthyRpcs,
      maximumBlockLag: config.maximumBlockLag,
      contracts: config.contracts,
    }),
    probeNetworkObservers(config.observerUrls),
  ]);
  const healthyObservers = observers.filter(
    (observer) => observer.ok && observer.chainId === config.chainId,
  );
  const allBlocks = [
    ...consensus.observations
      .filter(
        (observation) =>
          observation.ok && observation.chainId === config.chainId,
      )
      .map((observation) => observation.blockNumber)
      .filter((value): value is bigint => value !== null),
    ...healthyObservers
      .map((observer) => observer.blockNumber)
      .filter((value): value is bigint => value !== null),
  ];
  const headBlock =
    allBlocks.length > 0
      ? allBlocks.reduce((a, b) => (a > b ? a : b))
      : null;
  const oldestBlock =
    allBlocks.length > 0
      ? allBlocks.reduce((a, b) => (a < b ? a : b))
      : null;
  const blockLag =
    headBlock !== null && oldestBlock !== null
      ? headBlock - oldestBlock
      : null;
  const observerFailures = observers.flatMap((observer) =>
    !observer.ok
      ? [`${observer.host}: observer unavailable`]
      : observer.chainId !== config.chainId
        ? [`${observer.host}: observer chain ID ${observer.chainId}`]
        : [],
  );
  if (healthyObservers.length < config.minimumHealthyObservers) {
    observerFailures.push(
      `Only ${healthyObservers.length}/${config.minimumHealthyObservers} required observers agree.`,
    );
  }
  if (
    blockLag === null ||
    blockLag > BigInt(config.maximumBlockLag)
  ) {
    observerFailures.push(
      `Independent source head divergence exceeds ${config.maximumBlockLag} blocks.`,
    );
  }
  const failures = [
    ...consensus.failures.filter(
      (failure) => !failure.startsWith("RPC head divergence"),
    ),
    ...observerFailures,
  ];
  const status: PublicShadowStatus = {
    ok:
      failures.length === 0 &&
      consensus.contractsConsistent &&
      healthyObservers.length >= config.minimumHealthyObservers,
    enabled: config.enabled,
    ready: config.ready,
    mode: config.mode,
    releaseStage: config.releaseStage,
    realFundsEnabled: false,
    signingEnabled: false,
    x402MainnetEnabled: false,
    chainId: config.chainId,
    configFingerprint: config.configFingerprint,
    requiredHealthyRpcs: consensus.requiredHealthyRpcs,
    healthyRpcs: consensus.healthyRpcs,
    requiredHealthyObservers: config.minimumHealthyObservers,
    healthyObservers: healthyObservers.length,
    headBlock: headBlock?.toString() ?? null,
    blockLag: blockLag?.toString() ?? null,
    maximumBlockLag: consensus.maximumBlockLag,
    contractsConsistent: consensus.contractsConsistent,
    rpcHosts: consensus.observations.map((observation) => ({
      host: observation.host,
      healthy:
        observation.ok && observation.chainId === consensus.expectedChainId,
      chainId: observation.chainId,
      blockNumber: observation.blockNumber?.toString() ?? null,
      criticalContractsPresent:
        config.contracts.every(
          ({ label }) => Boolean(observation.contractCode[label]),
        ),
    })),
    observerHosts: observers.map((observer) => ({
      host: observer.host,
      healthy: observer.ok && observer.chainId === config.chainId,
      chainId: observer.chainId,
      blockNumber: observer.blockNumber?.toString() ?? null,
    })),
    failures,
    checkedAt: new Date().toISOString(),
    cached: false,
    circuitOpen: false,
  };

  if (status.ok) {
    consecutiveFailures = 0;
    circuitOpenUntil = 0;
    cache = { value: status, expiresAt: Date.now() + CACHE_TTL_MS };
  } else {
    consecutiveFailures += 1;
    cache = undefined;
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
    }
  }
  return status;
}

export function resetShadowStateForTests(): void {
  cache = undefined;
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}
