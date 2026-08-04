# Buyer validation protocol

LedgerGuard is not commercially validated by deployment, testnet activity, page views, or internal tests. The market gate is completed only with attributable evidence from independent buyers.

## Qualified buyer

A buyer interview counts only when the organization:

- operates an AI agent, wallet, payment API, checkout, treasury, or transaction-automation product;
- processes or expects at least 1,000 automated or semi-automated transaction actions per month;
- has a concrete problem involving intent, approval, simulation, or settlement evidence;
- can involve both an engineering owner and a budget owner.

## Evidence sequence

1. Five qualified buyer interviews with dated notes and an identifiable organization.
2. Three real, de-identified transaction samples supplied by those organizations.
3. Two independent Sandbox integrations with reproducible request IDs or public testnet evidence.
4. Repeat use on at least two separate days spanning 14 calendar days.
5. One written paid-pilot commitment that states scope, price, decision date, conditions, and acceptance criteria.

The sequence is cumulative. A later gate cannot retroactively make fabricated or project-owned evidence valid.

## Interview questions

1. Which transaction flow do you operate, and at what monthly volume?
2. Where can the intended recipient, asset, amount, or authorization diverge from the settled result?
3. What do you do before signing and after settlement today?
4. What was the last real failure or near miss, and what did it cost?
5. Who owns the engineering integration and who can approve a paid pilot?
6. Would a deterministic pre-sign decision plus strict receipt evidence replace or improve the current workflow?
7. What must be proven in Sandbox before you would pay USD 99, 499, or 2,500?

## Sample privacy boundary

Never collect private keys, seed phrases, signing authorizations, API secrets, personally identifiable information, customer identifiers, or unredacted production logs.

The minimum useful de-identified sample is:

- network and transaction type;
- intended asset, recipient, amount, and purpose;
- redacted calldata or a public transaction hash where safe;
- expected policy outcome;
- actual outcome and the control gap.

## Stop conditions

- Fewer than three interviews after 20 qualified, personalized contacts: stop feature expansion and revise the segment or message.
- No repeated control problem across the first five interviews: reject the current positioning.
- Neither Sandbox integration repeats across the 14-day window: do not open paid production.
- No buyer will make a written USD 99-or-higher commitment after a successful pilot: treat willingness to pay as unproven.

## Public claims

Only audited, aggregated counts from `docs/BUYER_EVIDENCE_REGISTER.md` may be published. Names, samples, and commercial terms require the buyer's written permission.
