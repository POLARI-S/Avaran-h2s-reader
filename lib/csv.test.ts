import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";

describe("csvCell", () => {
  it("passes plain values through unchanged", () => {
    expect(csvCell("MRPL-0142")).toBe("MRPL-0142");
    expect(csvCell(8)).toBe("8");
    expect(csvCell(true)).toBe("true");
  });

  it("neutralises formula-injection prefixes", () => {
    expect(csvCell("=1+1,x")).toBe("\"'=1+1,x\"");
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-1+1")).toBe("'-1+1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes values containing a comma, quote, or newline", () => {
    expect(csvCell("Doe, John")).toBe('"Doe, John"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("treats null/undefined as an empty cell", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
});
