import { describe, expect, it } from "vitest";
import {
  classify,
  darkening,
  darkeningFromDose,
  doseFromDarkening,
  srgbToLinear,
  twa,
  type Calibration,
  type Lin,
} from "./dose";

const cal: Calibration = {
  model: "saturating_exponential",
  A: 0.9,
  k: 0.035,
  channel: "b",
  doseMax: 60,
  provisional: true,
};

describe("srgbToLinear", () => {
  it("maps 0 to 0", () => {
    expect(srgbToLinear(0)).toBe(0);
  });

  it("maps 255 to 1", () => {
    expect(srgbToLinear(255)).toBe(1);
  });

  it("maps 128 to approximately 0.2158", () => {
    expect(srgbToLinear(128)).toBeCloseTo(0.2158, 3);
  });
});

describe("darkening / doseFromDarkening round trip", () => {
  it.each([0.5, 2, 8, 20, 40])("recovers dose %d ppm·h within 1e-6", (dose) => {
    const dA = darkeningFromDose(dose, cal);
    const result = doseFromDarkening(dA, cal);
    expect(result.dose).toBeCloseTo(dose, 6);
    expect(result.saturated).toBe(false);
  });
});

describe("doseFromDarkening edge cases", () => {
  it("returns dose 0 when dA <= 0", () => {
    expect(doseFromDarkening(0, cal)).toEqual({ dose: 0, saturated: false, extrapolated: false });
    expect(doseFromDarkening(-0.1, cal)).toEqual({ dose: 0, saturated: false, extrapolated: false });
  });

  it("flags saturated when dA >= 0.98*A", () => {
    const result = doseFromDarkening(cal.A * 0.98, cal);
    expect(result.saturated).toBe(true);
    expect(result.dose).toBe(cal.doseMax);
    expect(result.extrapolated).toBe(true);
  });

  it("flags extrapolated (but not saturated) beyond the calibrated dose range", () => {
    const lowMaxCal: Calibration = { ...cal, doseMax: 1 };
    const dA = darkeningFromDose(5, lowMaxCal);
    const result = doseFromDarkening(dA, lowMaxCal);
    expect(result.saturated).toBe(false);
    expect(result.extrapolated).toBe(true);
    expect(result.dose).toBeCloseTo(5, 6);
  });
});

describe("darkening", () => {
  const white: Lin = { r: 0.9, g: 0.9, b: 0.9, l: 0.9 };
  const reference: Lin = { r: 0.5, g: 0.35, b: 0.2, l: 0.4 };

  it("is zero when the patch equals the reference", () => {
    expect(darkening(white, reference, reference, "r")).toBeCloseTo(0, 9);
    expect(darkening(white, reference, reference, "b")).toBeCloseTo(0, 9);
    expect(darkening(white, reference, reference, "l")).toBeCloseTo(0, 9);
  });

  it("is positive when the patch is darker than the reference", () => {
    const darkerPatch: Lin = { r: 0.25, g: 0.175, b: 0.1, l: 0.2 };
    expect(darkening(white, reference, darkerPatch, "b")).toBeGreaterThan(0);
  });

  it("is negative when the patch is lighter than the reference", () => {
    const lighterPatch: Lin = { r: 0.7, g: 0.6, b: 0.5, l: 0.6 };
    expect(darkening(white, reference, lighterPatch, "b")).toBeLessThan(0);
  });
});

describe("twa", () => {
  it("divides dose by shift hours", () => {
    expect(twa(8, 8)).toBe(1);
    expect(twa(12, 8)).toBe(1.5);
  });
});

describe("classify", () => {
  const limit = 1;

  it("is SAFE strictly below 50% of the limit", () => {
    expect(classify(0.49 * limit, limit).band).toBe("SAFE");
  });

  it("is CAUTION at exactly 50% of the limit", () => {
    expect(classify(0.5 * limit, limit).band).toBe("CAUTION");
  });

  it("is CAUTION just below the limit", () => {
    expect(classify(0.99 * limit, limit).band).toBe("CAUTION");
  });

  it("is OVER LIMIT at exactly the limit", () => {
    expect(classify(1 * limit, limit).band).toBe("OVER LIMIT");
  });

  it("is OVER LIMIT just below 2x the limit", () => {
    expect(classify(1.99 * limit, limit).band).toBe("OVER LIMIT");
  });

  it("is HIGH at exactly 2x the limit", () => {
    expect(classify(2 * limit, limit).band).toBe("HIGH");
  });
});
