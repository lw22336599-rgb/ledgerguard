import { afterEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("rate limiting", () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_PER_MINUTE;
  });

  it("rejects requests after the configured per-path limit", async () => {
    process.env.RATE_LIMIT_PER_MINUTE = "1";
    const headers = { "x-real-ip": `test-${crypto.randomUUID()}` };

    const first = await app.request("/v1/networks", { headers });
    const second = await app.request("/v1/networks", { headers });

    expect(first.status).toBe(200);
    expect(first.headers.get("ratelimit-remaining")).toBe("0");
    expect(second.status).toBe(429);
    expect(second.headers.get("retry-after")).toBeTruthy();
  });
});
