import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { controlIntentSchema } from "../src/domain/control-envelope.js";

type Fixture = {
  profile: string;
  cases: Array<{ id: string; valid: boolean; intent: unknown }>;
};

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../conformance/profile-v1/control-intents.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture;

describe("LedgerGuard Risk Signal Profile v1 self-test", () => {
  it("has a pinned profile identifier", () => {
    expect(fixture.profile).toBe("ledgerguard-risk-signal-profile-v1");
  });

  for (const testCase of fixture.cases) {
    it(testCase.id, () => {
      expect(controlIntentSchema.safeParse(testCase.intent).success).toBe(
        testCase.valid,
      );
    });
  }
});
