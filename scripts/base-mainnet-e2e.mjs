/**
 * Retired Base Mainnet real-fund helper.
 *
 * Production repositories must not contain automation that imports a private
 * key and signs mainnet transactions. Use the read-only historical verifier in
 * base-mainnet-e2e-v3.mjs for evidence review. Any future funded test requires
 * a separately reviewed, untracked operator procedure and explicit approval at
 * the time of signing.
 */

throw new Error(
  "Retired for safety: this repository does not sign Base Mainnet transactions. Run scripts/base-mainnet-e2e-v3.mjs for read-only verification.",
);
