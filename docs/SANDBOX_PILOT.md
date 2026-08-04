# 30-minute Sandbox pilot

## Goal

Prove whether LedgerGuard can catch a real intent-to-settlement control gap without custody, signing, or production funds.

## Before the session

The buyer supplies one de-identified transaction example, a Sandbox or public-testnet environment, an engineering owner, and the expected decision. Never send keys, seed phrases, API secrets, signing authorizations, PII, customer IDs, or unredacted production logs.

## Working session

1. Describe the intended payer, recipient, asset, amount, purpose, and policy limit.
2. Run the transaction through the pre-sign endpoint in Sandbox.
3. Compare the deterministic `ALLOW`, `REVIEW`, or `BLOCK` result with the buyer's expected control.
4. After a testnet settlement, generate strict evidence and compare intended versus observed movement.
5. Record reproducible request IDs and the buyer's pass/fail decision.

## Repeat-use checkpoint

The integration is not counted as repeated use until the same external organization submits verified requests on two or more separate days spanning at least 14 calendar days. Automated project-owner traffic does not count.

## Commercial checkpoint

After a successful Sandbox result, test one of these paid-pilot anchors:

- USD 99: one workflow, limited volume, community support;
- USD 499: one team, policy templates, retained evidence, integration support;
- USD 2,500: scoped enterprise pilot with acceptance criteria and review.

A commitment counts only when the buyer writes the selected scope, price, decision date, conditions, and acceptance criteria. Payment details are handled separately and never stored in this repository.
