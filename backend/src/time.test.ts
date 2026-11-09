import { describe, expect, it } from "vitest";
import { zonedToUtc } from "./time.js";

describe("zonedToUtc", () => {
  it("converts a Melbourne winter time to UTC", () => {
    const utc = zonedToUtc("2026-07-15", "10:30");
    expect(utc.toISOString()).toBe("2026-07-15T00:30:00.000Z");
  });

  it("converts a Melbourne summer time to UTC", () => {
    const utc = zonedToUtc("2026-01-15", "10:30");
    expect(utc.toISOString()).toBe("2026-01-14T23:30:00.000Z");
  });
});
