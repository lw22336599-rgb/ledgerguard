const baseUrl =
  process.env.LEDGERGUARD_URL ?? "https://ledgerguard-gules.vercel.app";
const apiKey = process.env.LEDGERGUARD_API_KEY;

if (!apiKey) {
  throw new Error(
    "Set LEDGERGUARD_API_KEY to a test key created at /developer.",
  );
}

const recipient = "0x2222222222222222222222222222222222222222";
const usdc = "0x3600000000000000000000000000000000000000";
const data =
  "0xa9059cbb" +
  recipient.slice(2).padStart(64, "0") +
  1_000_000n.toString(16).padStart(64, "0");

const response = await fetch(`${baseUrl}/v1/developer/shadow`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "x-ledgerguard-client": "quickstart/0.1.0",
  },
  body: JSON.stringify({
    network: "arcTestnet",
    to: usdc,
    data,
    valueWei: "0",
    intent: {
      action: "transfer",
      expectedRecipient: recipient,
      expectedAssetAddress: usdc,
      expectedAmountMicroUsdc: "1000000",
      purpose: "Five-minute LedgerGuard integration",
    },
    policy: {
      allowUnlimitedApproval: false,
      requireSimulation: false,
      maxAmountMicroUsdc: "1000000",
    },
  }),
});

const result = await response.json();
if (!response.ok) throw new Error(JSON.stringify(result));
console.log(JSON.stringify(result, null, 2));
