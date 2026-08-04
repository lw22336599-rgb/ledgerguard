/**
 * Threat intelligence and anti-phishing checks (closed-loop ring #7).
 *
 * Design principles:
 * - Pure-algorithm rules (zero address, burn address, EIP-55 checksum,
 *   self-transfer) are always available and never depend on the network.
 * - External blacklist data (GoPlus free tier) is a pluggable source:
 *   when reachable it contributes critical findings; when unreachable the
 *   check degrades to a warning (fail-open, never false-positive BLOCK).
 * - No fabricated data: the seed blacklist only contains publicly known
 *   malicious addresses added via documented sources.
 *
 * @see docs/OPEN_SOURCE_POLICY.md — engine layer stays closed-source;
 * this module is part of the hosted oracle engine.
 */

import { getAddress, keccak256, toBytes } from "viem";
import type { Address } from "viem";
import type { Severity, Finding } from "./preflight.js";

/** Zero address — paying it burns funds irrecoverably. */
export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/** Common burn addresses (0xdead..., 0x0000...dEaD). */
export const BURN_ADDRESSES: Address[] = [
  "0x000000000000000000000000000000000000dEaD",
  "0x000000000000000000000000000000000000dead",
  "0xDeaD000000000000000000000000000000000000",
];

/**
 * Seed blacklist of publicly known malicious / sanctioned addresses.
 *
 * NOTE: entries are loaded from a data file when present so the engine can
 * grow without code changes. The seed list ships empty in this repository;
 * production populates it from documented public sources (GoPlus free tier
 * snapshots, public scam lists) — never from fabricated data.
 */
let seedBlacklist: Set<string> = new Set();

export function setSeedBlacklist(addresses: Iterable<string>): void {
  seedBlacklist = new Set(
    [...addresses].map((a) => {
      try {
        return getAddress(a).toLowerCase();
      } catch {
        return a.toLowerCase();
      }
    }),
  );
}

export function clearSeedBlacklist(): void {
  seedBlacklist = new Set();
}

export function isInSeedBlacklist(address: Address): boolean {
  return seedBlacklist.has(String(address).toLowerCase());
}

/**
 * EIP-55 checksum validation. Only mixed-case addresses carry a checksum;
 * all-lowercase / all-uppercase forms are treated as checksum-less and pass.
 */
export function hasValidEip55(address: Address): boolean {
  const raw = address as string;
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) return false;
  const lower = raw.slice(2).toLowerCase();
  const mixed = raw.slice(2);
  const isMixedCase = /[a-f]/.test(mixed) && /[A-F]/.test(mixed);
  if (!isMixedCase) return true; // checksum-less form, nothing to verify
  const hash = sha3KeccakHex(lower);
  for (let i = 0; i < 40; i += 1) {
    const nibble = parseInt(hash[i] as string, 16);
    const char = mixed[i] as string;
    if ((nibble >= 8 && char >= "a" && char <= "f") || (nibble < 8 && char >= "A" && char <= "F")) {
      return false;
    }
  }
  return true;
}

/** Synchronous keccak-256 returning lowercase hex (used by EIP-55). */
function sha3KeccakHex(input: string): string {
  return keccak256(toBytes(`0x${input}`)).slice(2);
}

export interface ThreatCheckOptions {
  /** If true, self-transfers are treated as warnings. Default true. */
  flagSelfTransfer?: boolean;
}

/**
 * Run pure-algorithm threat checks against a recipient / target / debit
 * address. Returns findings (never throws).
 */
export function checkAddressThreats(
  address: Address | undefined,
  options: ThreatCheckOptions = {},
): Finding[] {
  const findings: Finding[] = [];
  if (!address) return findings;
  const raw = address as string;
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    return [
      {
        code: "INVALID_ADDRESS_FORMAT",
        severity: "critical",
        message: "The address is not a valid 40-hex EVM address.",
      },
    ];
  }
  const lower = raw.toLowerCase() as `0x${string}`;

  if (lower === ZERO_ADDRESS.toLowerCase()) {
    findings.push({
      code: "ZERO_ADDRESS_RECIPIENT",
      severity: "critical",
      message: "The recipient is the zero address; funds would be irrecoverably burned.",
    });
  }

  if (BURN_ADDRESSES.some((burn) => lower === burn.toLowerCase())) {
    findings.push({
      code: "BURN_ADDRESS_RECIPIENT",
      severity: "warning",
      message: "The recipient is a known burn address; funds sent there are destroyed.",
    });
  }

  if (!hasValidEip55(raw as `0x${string}`)) {
    findings.push({
      code: "EIP55_CHECKSUM_INVALID",
      severity: "warning",
      message: "The address fails EIP-55 checksum validation; verify it is not a phishing address.",
    });
  }

  if (isInSeedBlacklist(raw as `0x${string}`)) {
    findings.push({
      code: "KNOWN_MALICIOUS_ADDRESS",
      severity: "critical",
      message: "The address is on the public known-malicious blacklist.",
    });
  }

  return findings;
}

/**
 * Check a transfer pair for self-transfer confusion (frequently used to
 * obfuscate or to satisfy "any transfer happened" conditions).
 */
export function checkSelfTransfer(
  from: Address | undefined,
  to: Address | undefined,
  options: ThreatCheckOptions = {},
): Finding[] {
  if (!from || !to || options.flagSelfTransfer === false) return [];
  const fromLower = String(from).toLowerCase();
  const toLower = String(to).toLowerCase();
  if (/^0x[0-9a-fA-F]{40}$/.test(fromLower) && fromLower === toLower) {
    return [
      {
        code: "SELF_TRANSFER",
        severity: "warning",
        message: "The transaction transfers to its own debit address; confirm this is intended.",
      },
    ];
  }
  return [];
}

/**
 * Pluggable external blacklist source (e.g. GoPlus free tier).
 * The engine calls this when the network is available; when it throws or
 * times out the engine degrades to a warning instead of blocking.
 */
export interface ThreatDataSource {
  readonly name: string;
  check(address: Address): Promise<Finding[]>;
}

export async function runExternalSources(
  address: Address | undefined,
  sources: ThreatDataSource[],
  timeoutMs = 3000,
): Promise<{ findings: Finding[]; degraded: boolean }> {
  if (!address || sources.length === 0) return { findings: [], degraded: false };

  const checkWithTimeout = async (source: ThreatDataSource): Promise<Finding[]> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        source.check(address),
        new Promise<Finding[]>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`Threat source timed out: ${source.name}`)),
            Math.max(1, timeoutMs),
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  const results = await Promise.allSettled(
    sources.map((source) => checkWithTimeout(source)),
  );
  const findings: Finding[] = [];
  let degraded = false;
  for (const result of results) {
    if (result.status === "fulfilled") {
      findings.push(...result.value);
    } else {
      degraded = true;
    }
  }
  if (degraded) {
    findings.push({
      code: "THREAT_SOURCE_UNAVAILABLE",
      severity: "warning",
      message: "External threat-intelligence source was unreachable; blacklist checks degraded.",
    });
  }
  return { findings, degraded };
}

export type { Severity };
