# Data flywheel and privacy policy

The intended data moat is a maintained graph of risk signals, confirmed
incidents, corrections, and intent-versus-settlement outcomes. No such moat is
claimed merely because an event schema exists.

## Collection boundary

The public reference core collects no private training corpus. Any future
hosted telemetry must be opt-in and use `ledgerguard.telemetry.v1`:

- derived finding codes and decision outcomes;
- pseudonymous integration and intent digests;
- CAIP-2 network and evaluator version;
- explicit consent and a declared privacy envelope.

Raw addresses, calldata, purpose text, wallet identifiers, private keys, seed
phrases, customer policy, and confidential transaction context are excluded by
default. Secrets are never telemetry.

## Quality gates

Before data changes a production decision, the private pipeline must record:

- source provenance, collection time, freshness, and permitted use;
- independent labels and correction/appeal history;
- precision, recall, false-positive rate, false-negative incident rate, and
  coverage by network and action type;
- holdout evaluation and rollback criteria for every model or ruleset release;
- retention, deletion, access control, and incident-response policy.

Unknown or unavailable external threat data must not be silently represented as
safe. Deterministic rules remain authoritative; AI may explain and rank review
queues but cannot override a block.

## Open and private split

Public MIT assets:

- event schemas, risk-signal vocabulary, protocol mappings, fixtures, SDKs,
  receipt verification, and deterministic baseline rules.

Private commercial assets in a separate repository and data plane:

- licensed and consented datasets, customer-specific graphs, analyst labels,
  proprietary features and models, enterprise policy, alerting, retention,
  billing, SLA operations, and OEM configuration.

No private dataset or enterprise model may be committed to this MIT repository.
