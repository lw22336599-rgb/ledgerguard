import {
  decodeFunctionData,
  getAddress,
  isAddressEqual,
  maxUint256,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { ARC_TESTNET_USDC } from "../config/networks.js";
import { resolveNetworkAdapter } from "../adapters/network-adapter.js";
import type { PreflightInput } from "../schemas.js";
import type { SimulationResult } from "../lib/rpc.js";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]);

const approvalForAllAbi = parseAbi([
  "function setApprovalForAll(address operator, bool approved)",
]);

export type Decision = "ALLOW" | "REVIEW" | "BLOCK";
export type Severity = "info" | "warning" | "critical";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
}

export interface DecodedAction {
  kind:
    | "native_usdc_transfer"
    | "erc20_transfer"
    | "erc20_approve"
    | "erc20_transfer_from"
    | "operator_approval"
    | "contract_call";
  target: Address;
  debitAddress?: Address;
  recipient?: Address;
  assetAddress?: Address;
  amountMicroUsdc?: string;
  approvalAmount?: string;
  method?: string;
}

export interface PreflightResult {
  decision: Decision;
  network: string;
  decoded: DecodedAction;
  simulation: SimulationResult;
  findings: Finding[];
}

function decodeAction(input: PreflightInput): DecodedAction {
  const to = getAddress(input.to);
  const data = input.data as Hex;
  const valueWei = BigInt(input.valueWei);

  if (data === "0x" && valueWei > 0n) {
    return {
      kind: "native_usdc_transfer",
      target: to,
      ...(input.from ? { debitAddress: getAddress(input.from) } : {}),
      recipient: to,
      assetAddress: ARC_TESTNET_USDC,
      amountMicroUsdc: (valueWei / 1_000_000_000_000n).toString(),
      method: "native value transfer",
    };
  }

  if (data !== "0x") {
    try {
      const decoded = decodeFunctionData({ abi: erc20Abi, data });
      if (decoded.functionName === "transfer") {
        const [recipient, amount] = decoded.args;
        return {
          kind: "erc20_transfer",
          target: to,
          ...(input.from ? { debitAddress: getAddress(input.from) } : {}),
          recipient: getAddress(recipient),
          assetAddress: to,
          amountMicroUsdc: amount.toString(),
          method: "transfer(address,uint256)",
        };
      }
      if (decoded.functionName === "approve") {
        const [spender, amount] = decoded.args;
        return {
          kind: "erc20_approve",
          target: to,
          ...(input.from ? { debitAddress: getAddress(input.from) } : {}),
          recipient: getAddress(spender),
          assetAddress: to,
          approvalAmount: amount.toString(),
          method: "approve(address,uint256)",
        };
      }
      if (decoded.functionName === "transferFrom") {
        const [source, recipient, amount] = decoded.args;
        return {
          kind: "erc20_transfer_from",
          target: to,
          debitAddress: getAddress(source),
          recipient: getAddress(recipient),
          assetAddress: to,
          amountMicroUsdc: amount.toString(),
          method: "transferFrom(address,address,uint256)",
        };
      }
    } catch {
      // Try another known ABI below.
    }

    try {
      const decoded = decodeFunctionData({ abi: approvalForAllAbi, data });
      if (decoded.functionName === "setApprovalForAll") {
        const [operator, approved] = decoded.args;
        return {
          kind: "operator_approval",
          target: to,
          ...(input.from ? { debitAddress: getAddress(input.from) } : {}),
          recipient: getAddress(operator),
          approvalAmount: approved ? maxUint256.toString() : "0",
          method: "setApprovalForAll(address,bool)",
        };
      }
    } catch {
      // Unknown calldata is deliberately returned for human or policy review.
    }
  }

  return {
    kind: "contract_call",
    target: to,
    method: data === "0x" ? "empty call" : data.slice(0, 10),
  };
}

function sameAddress(left: string, right: string): boolean {
  return isAddressEqual(getAddress(left), getAddress(right));
}

export function evaluatePreflight(
  input: PreflightInput,
  simulation: SimulationResult,
): PreflightResult {
  const decoded = decodeAction(input);
  const findings: Finding[] = [];
  const valueWei = BigInt(input.valueWei);
  const adapter = resolveNetworkAdapter(input.network);

  if (
    adapter.nativeUsdcGas &&
    valueWei > 0n &&
    valueWei % 1_000_000_000_000n !== 0n
  ) {
    findings.push({
      code: "ARC_NATIVE_DECIMAL_REMAINDER",
      severity: "critical",
      message:
        "Native msg.value is not exactly representable in the 6-decimal USDC product view.",
    });
  }

  if (
    decoded.kind === "native_usdc_transfer" &&
    !adapter.nativeUsdcGas
  ) {
    findings.push({
      code: "NATIVE_STABLECOIN_UNSUPPORTED",
      severity: "critical",
      message:
        "Native-value transfers are only supported on Arc networks with USDC gas. Use ERC-20 USDC calldata on this network.",
    });
  }

  if (
    input.policy.allowedTargets &&
    !input.policy.allowedTargets.some((target) => sameAddress(target, decoded.target))
  ) {
    findings.push({
      code: "TARGET_NOT_ALLOWED",
      severity: "critical",
      message: "The outer transaction target is not in the allowed target list.",
    });
  }

  if (
    input.intent.expectedRecipient &&
    (!decoded.recipient ||
      !sameAddress(input.intent.expectedRecipient, decoded.recipient))
  ) {
    findings.push({
      code: "RECIPIENT_MISMATCH",
      severity: "critical",
      message: "The decoded recipient does not match the declared intent.",
    });
  }

  if (
    decoded.kind === "erc20_transfer_from" &&
    !input.intent.expectedDebitAddress
  ) {
    findings.push({
      code: "DEBIT_ADDRESS_REQUIRED",
      severity: "critical",
      message:
        "transferFrom requires an explicitly declared debit address before it can be allowed.",
    });
  } else if (
    (input.intent.action === "transfer" || input.intent.action === "approve") &&
    !input.intent.expectedDebitAddress
  ) {
    findings.push({
      code: "DEBIT_ADDRESS_NOT_DECLARED",
      severity: "warning",
      message:
        "Declare the expected payer or approval owner before treating this result as safe to sign.",
    });
  } else if (
    input.intent.expectedDebitAddress &&
    (!decoded.debitAddress ||
      !sameAddress(input.intent.expectedDebitAddress, decoded.debitAddress))
  ) {
    findings.push({
      code: "DEBIT_ADDRESS_MISMATCH",
      severity: "critical",
      message: "The decoded debit address does not match the declared intent.",
    });
  }

  if (
    input.intent.expectedAssetAddress &&
    (!decoded.assetAddress ||
      !sameAddress(input.intent.expectedAssetAddress, decoded.assetAddress))
  ) {
    findings.push({
      code: "ASSET_MISMATCH",
      severity: "critical",
      message: "The decoded asset does not match the declared intent.",
    });
  }

  if (
    decoded.assetAddress &&
    !sameAddress(decoded.assetAddress, adapter.usdcAddress)
  ) {
    findings.push({
      code: "NON_USDC_ASSET",
      severity: "critical",
      message: "The token call does not target the official USDC contract for this network.",
    });
  }

  if (
    input.intent.expectedAmountMicroUsdc &&
    (decoded.amountMicroUsdc ?? decoded.approvalAmount) !==
      input.intent.expectedAmountMicroUsdc
  ) {
    findings.push({
      code: "AMOUNT_MISMATCH",
      severity: "critical",
      message: "The decoded transfer amount does not match the declared intent.",
    });
  }

  const measurableAmount = decoded.amountMicroUsdc ?? decoded.approvalAmount;
  if (decoded.kind !== "native_usdc_transfer" && valueWei > 0n) {
    findings.push({
      code: "UNEXPECTED_NATIVE_VALUE",
      severity: "critical",
      message: adapter.nativeUsdcGas
        ? "A token or contract call must not also send undeclared native USDC value."
        : "A token or contract call must not send native chain currency alongside token calldata.",
    });
  }

  if (
    (decoded.kind === "native_usdc_transfer" ||
      decoded.kind === "erc20_transfer" ||
      decoded.kind === "erc20_transfer_from") &&
    decoded.amountMicroUsdc === "0"
  ) {
    findings.push({
      code: "ZERO_TRANSFER_AMOUNT",
      severity: "critical",
      message: "A payment transfer must move an amount greater than zero.",
    });
  }

  if (decoded.kind === "native_usdc_transfer") {
    if (simulation.targetHasCode === true) {
      findings.push({
        code: "NATIVE_CONTRACT_RECIPIENT",
        severity: "warning",
        message:
          "The native USDC recipient is a contract; its full fallback effects require a contract-specific policy.",
      });
    } else if (simulation.targetHasCode === undefined) {
      findings.push({
        code: "RECIPIENT_CODE_NOT_CHECKED",
        severity: "warning",
        message:
          "LedgerGuard could not confirm that the native USDC recipient is an externally owned account.",
      });
    }
  }

  if (
    input.policy.maxAmountMicroUsdc &&
    measurableAmount &&
    BigInt(measurableAmount) > BigInt(input.policy.maxAmountMicroUsdc)
  ) {
    findings.push({
      code: "POLICY_AMOUNT_EXCEEDED",
      severity: "critical",
      message: "The decoded amount exceeds the explicit policy maximum.",
    });
  }

  if (
    (decoded.kind === "erc20_approve" || decoded.kind === "operator_approval") &&
    decoded.approvalAmount === maxUint256.toString() &&
    !input.policy.allowUnlimitedApproval
  ) {
    findings.push({
      code: "UNLIMITED_APPROVAL",
      severity: "critical",
      message: "Unlimited approval is blocked unless the policy explicitly allows it.",
    });
  }

  const expectedKind =
    input.intent.action === "transfer"
      ? new Set(["native_usdc_transfer", "erc20_transfer", "erc20_transfer_from"])
      : input.intent.action === "approve"
        ? new Set(["erc20_approve", "operator_approval"])
        : new Set(["contract_call"]);

  if (!expectedKind.has(decoded.kind)) {
    findings.push({
      code: "ACTION_MISMATCH",
      severity: "critical",
      message: "The decoded action type does not match the declared intent.",
    });
  }

  if (decoded.kind === "contract_call") {
    findings.push({
      code: "UNKNOWN_CALL",
      severity: "warning",
      message: "The calldata is not one of LedgerGuard's currently decoded methods.",
    });
  }

  if (simulation.status === "failed") {
    findings.push({
      code: "SIMULATION_FAILED",
      severity: "critical",
      message: simulation.error ?? "The read-only RPC simulation failed.",
    });
  } else if (simulation.status !== "success") {
    findings.push({
      code: "SIMULATION_REQUIRED",
      severity: input.policy.requireSimulation ? "critical" : "warning",
      message: input.policy.requireSimulation
        ? "A successful read-only simulation is required before signing."
        : "Simulation was not run; do not treat this result as approval to sign.",
    });
  }

  const decision: Decision = findings.some((item) => item.severity === "critical")
    ? "BLOCK"
    : findings.some((item) => item.severity === "warning")
      ? "REVIEW"
      : "ALLOW";

  return {
    decision,
    network: input.network,
    decoded,
    simulation,
    findings,
  };
}
