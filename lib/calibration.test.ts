import { describe, expect, it } from "vitest";
import { CalibrationImportError, parseModelParams, validateCalibrationInput } from "./calibration";

describe("parseModelParams", () => {
  it("accepts a valid saturating_exponential model file", () => {
    const cal = parseModelParams({
      model: "saturating_exponential",
      params: [0.87, 0.031],
      metric: "dA_B",
      dose_max: 55,
      r2: 0.98,
    });
    expect(cal.A).toBe(0.87);
    expect(cal.k).toBe(0.031);
    expect(cal.channel).toBe("b");
    expect(cal.doseMax).toBe(55);
  });

  it("maps metric suffixes to the right channel", () => {
    expect(parseModelParams({ params: [0.9, 0.03], metric: "dA_R" }).channel).toBe("r");
    expect(parseModelParams({ params: [0.9, 0.03], metric: "dA_G" }).channel).toBe("g");
    expect(parseModelParams({ params: [0.9, 0.03], metric: "dA_L" }).channel).toBe("l");
  });

  it("rejects a file whose model is not saturating_exponential, with a clear message", () => {
    expect(() => parseModelParams({ model: "langmuir", params: [0.9, 0.03] })).toThrow(
      CalibrationImportError,
    );
    try {
      parseModelParams({ model: "langmuir", params: [0.9, 0.03] });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CalibrationImportError);
      expect((err as Error).message).toMatch(/langmuir/i);
    }
  });

  it("rejects a file missing params", () => {
    expect(() => parseModelParams({ model: "saturating_exponential" })).toThrow(
      CalibrationImportError,
    );
  });

  it("rejects non-positive params", () => {
    expect(() => parseModelParams({ params: [0, 0.03] })).toThrow(CalibrationImportError);
    expect(() => parseModelParams({ params: [0.9, -1] })).toThrow(CalibrationImportError);
  });
});

describe("validateCalibrationInput", () => {
  it("rejects A = 0", () => {
    expect(validateCalibrationInput({ A: 0, k: 0.03, doseMax: 60 })).not.toBeNull();
  });

  it("rejects k = 0", () => {
    expect(validateCalibrationInput({ A: 0.9, k: 0, doseMax: 60 })).not.toBeNull();
  });

  it("rejects doseMax = 0", () => {
    expect(validateCalibrationInput({ A: 0.9, k: 0.03, doseMax: 0 })).not.toBeNull();
  });

  it("accepts all-positive input", () => {
    expect(validateCalibrationInput({ A: 0.9, k: 0.03, doseMax: 60 })).toBeNull();
  });
});
