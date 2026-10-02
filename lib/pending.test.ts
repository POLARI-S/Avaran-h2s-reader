import { describe, expect, it } from "vitest";
import { isPendingResult } from "./pending";

describe("isPendingResult", () => {
  it("demo + provisional is not pending", () => {
    expect(isPendingResult({ demo: true }, { provisional: true })).toBe(false);
  });
  it("real + provisional is pending", () => {
    expect(isPendingResult({ demo: false }, { provisional: true })).toBe(true);
  });
  it("real + validated is not pending", () => {
    expect(isPendingResult({ demo: false }, { provisional: false })).toBe(false);
  });
});
