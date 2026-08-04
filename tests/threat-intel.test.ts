import { describe, expect, it } from "vitest";
import { getAddress } from "viem";
import {
  BURN_ADDRESSES,
  checkAddressThreats,
  checkSelfTransfer,
  clearSeedBlacklist,
  hasValidEip55,
  isInSeedBlacklist,
  setSeedBlacklist,
  runExternalSources,
  ZERO_ADDRESS,
} from "../src/services/threat-intel.js";

const recipient = "0x2222222222222222222222222222222222222222";
const sender = "0x1111111111111111111111111111111111111111";

describe("threat-intel pure checks", () => {
  it("flags zero address as critical", () => {
    const findings = checkAddressThreats(ZERO_ADDRESS);
    expect(findings.some((f) => f.code === "ZERO_ADDRESS_RECIPIENT" && f.severity === "critical")).toBe(true);
  });

  it("flags burn addresses as warning", () => {
    const findings = checkAddressThreats(BURN_ADDRESSES[0]);
    expect(findings.some((f) => f.code === "BURN_ADDRESS_RECIPIENT" && f.severity === "warning")).toBe(true);
  });

  it("passes a normal EOA address without findings", () => {
    const findings = checkAddressThreats(recipient);
    expect(findings).toEqual([]);
  });

  it("flags a checksum-invalid mixed-case address as warning", () => {
    // Use an address that contains hex letters (0xAb...), then flip one
    // letter's case — the EIP-55 checksum can no longer match.
    const withLetters = "0xAbCdEf0000000000000000000000000000000000";
    const idx = withLetters.split("").findIndex((c) => /[a-f]/.test(c));
    expect(idx).toBeGreaterThan(0);
    const badChecksum =
      withLetters.slice(0, idx) +
      withLetters[idx]!.toUpperCase() +
      withLetters.slice(idx + 1);
    expect(badChecksum).not.toBe(withLetters);
    const findings = checkAddressThreats(badChecksum as `0x${string}`);
    expect(findings.some((f) => f.code === "EIP55_CHECKSUM_INVALID" && f.severity === "warning")).toBe(true);
  });

  it("validates EIP-55 for canonical addresses", () => {
    const canonical = getAddress("0x52908400098527886E0F7030069857D2E4169EE7");
    expect(hasValidEip55(canonical)).toBe(true);
  });

  it("accepts valid mixed-case checksums produced by viem", () => {
    const addresses = [
      getAddress("0xf1437d9cd304ae49f2ec005ac967813b3a7c466c"),
      getAddress("0x4732d748a7da766a0192adc2bbefc6041aaf9056"),
    ];

    for (const address of addresses) {
      expect(hasValidEip55(address)).toBe(true);
      expect(checkAddressThreats(address).some((finding) => finding.code === "EIP55_CHECKSUM_INVALID")).toBe(false);
    }
  });

  it("rejects a mixed-case address with an invalid EIP-55 checksum", () => {
    expect(hasValidEip55("0x52908400098527886E0F7030069857D2E4169Ee7")).toBe(false);
  });

  it("treats all-lowercase as checksum-less and valid", () => {
    expect(hasValidEip55(recipient)).toBe(true);
  });

  it("flags addresses on the seed blacklist", () => {
    clearSeedBlacklist();
    const malicious = "0x9999999999999999999999999999999999999999";
    setSeedBlacklist([malicious]);
    expect(isInSeedBlacklist(malicious)).toBe(true);
    const findings = checkAddressThreats(malicious);
    expect(findings.some((f) => f.code === "KNOWN_MALICIOUS_ADDRESS" && f.severity === "critical")).toBe(true);
    clearSeedBlacklist();
  });

  it("flags self-transfer as warning", () => {
    const findings = checkSelfTransfer(sender, sender);
    expect(findings.some((f) => f.code === "SELF_TRANSFER" && f.severity === "warning")).toBe(true);
  });

  it("does not flag a normal transfer pair", () => {
    const findings = checkSelfTransfer(sender, recipient);
    expect(findings).toEqual([]);
  });

  it("treats malformed address as critical format error", () => {
    const findings = checkAddressThreats("0xnotanaddress");
    expect(findings.some((f) => f.code === "INVALID_ADDRESS_FORMAT" && f.severity === "critical")).toBe(true);
  });

  it("marks an external source timeout as degraded", async () => {
    const result = await runExternalSources(
      recipient,
      [
        {
          name: "never-responds",
          check: () => new Promise(() => undefined),
        },
      ],
      5,
    );

    expect(result.degraded).toBe(true);
    expect(result.findings.some((finding) => finding.code === "THREAT_SOURCE_UNAVAILABLE")).toBe(true);
  });
});
