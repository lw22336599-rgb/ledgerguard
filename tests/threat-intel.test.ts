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
    const canonical = getAddress(recipient);
    expect(hasValidEip55(canonical)).toBe(true);
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
});
