/**
 * Core H2S dose maths — pure functions, no UI imports.
 * Pipeline mirrors the reference implementation (legacy/index.html) and the
 * lab fit (fit_model.py): sRGB -> linear -> darkening vs reference -> dose -> TWA.
 */

export type Channel = "r" | "g" | "b" | "l";

export type Lin = { r: number; g: number; b: number; l: number };

export type Calibration = {
  model: "saturating_exponential";
  A: number;
  k: number;
  channel: Channel;
  doseMax: number;
  provisional: boolean;
};

export type DoseResult = {
  dose: number;
  saturated: boolean;
  extrapolated: boolean;
};

export type Band = "SAFE" | "CAUTION" | "OVER LIMIT" | "HIGH";

export type Classification = { band: Band; frac: number };

const EPS = 1e-6;

// 1. sRGB byte -> linear
export const srgbToLinear = (c255: number): number => {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

// Inverse of srgbToLinear — used to paint synthetic demo patches.
export function linearToSrgb(v: number): number {
  const c = Math.max(0, Math.min(1, v));
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

// 2. Mean linear RGB of a region, from raw RGBA bytes (e.g. ImageData.data).
// Callers should pass only the centre ~60% of a tap box to avoid edge pixels.
export function sampleLinearRGB(pixels: Uint8ClampedArray): Lin {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    r += srgbToLinear(pixels[i]);
    g += srgbToLinear(pixels[i + 1]);
    b += srgbToLinear(pixels[i + 2]);
  }
  r /= n;
  g /= n;
  b /= n;
  return { r, g, b, l: 0.2126 * r + 0.7152 * g + 0.0722 * b };
}

// 3. Darkening relative to the reference patch, normalised by the white reference.
export function darkening(white: Lin, reference: Lin, patch: Lin, ch: Channel): number {
  const refRatio = Math.max(reference[ch], EPS) / Math.max(white[ch], EPS);
  const patchRatio = Math.max(patch[ch], EPS) / Math.max(white[ch], EPS);
  return -Math.log10(Math.max(patchRatio, EPS) / Math.max(refRatio, EPS));
}

// 4. Calibration model: dA = A * (1 - exp(-k*D)); inverse solved for D.
export function doseFromDarkening(dA: number, cal: Calibration): DoseResult {
  if (!(dA > 0)) return { dose: 0, saturated: false, extrapolated: false };
  if (dA >= cal.A * 0.98) return { dose: cal.doseMax, saturated: true, extrapolated: true };
  const dose = -(1 / cal.k) * Math.log(1 - dA / cal.A);
  return { dose, saturated: false, extrapolated: dose > cal.doseMax };
}

// Forward model — used by lib/demo.ts to generate synthetic patches.
export function darkeningFromDose(dose: number, cal: Calibration): number {
  return cal.A * (1 - Math.exp(-cal.k * dose));
}

// 5. TWA and status
export const twa = (dosePpmH: number, shiftHours: number): number => dosePpmH / shiftHours;

export function classify(twaPpm: number, limitPpm: number): Classification {
  const frac = twaPpm / limitPpm;
  const band: Band = frac < 0.5 ? "SAFE" : frac < 1 ? "CAUTION" : frac < 2 ? "OVER LIMIT" : "HIGH";
  return { band, frac };
}

export const DEFAULT_CAL: Calibration = {
  model: "saturating_exponential",
  A: 0.9,
  k: 0.035,
  channel: "b",
  doseMax: 60,
  provisional: true,
};

export const STANDARDS = {
  acgih: { label: "ACGIH TLV — 1 ppm 8-h TWA (recommended)", twa: 1 },
  india: { label: "Factories Act 1948 (India) — 10 ppm 8-h TWA", twa: 10 },
} as const;

export type StandardKey = keyof typeof STANDARDS;

// Text-on-soft-background colour pairs, each checked to meet WCAG AA's 4.5:1
// contrast minimum (the original lighter shades from legacy/index.html read
// as low as 3.07:1 here, since that app only ever used them as solid fills,
// never as small bold text on a tint — Lighthouse's accessibility audit
// caught this during the Phase 1 build).
export const BAND_META: Record<Band, { color: string; softColor: string; advice: string }> = {
  SAFE: {
    color: "#166534",
    softColor: "#ecfdf3",
    advice: "Below half the shift limit. No action needed.",
  },
  CAUTION: {
    color: "#92400e",
    softColor: "#fffbeb",
    advice: "Between 50% and 100% of the shift limit. Check the work area and ventilation.",
  },
  "OVER LIMIT": {
    color: "#9a3412",
    softColor: "#fff4ed",
    advice: "Above the 8-hour exposure limit. Report to the safety officer and review the area.",
  },
  HIGH: {
    color: "#b91c1c",
    softColor: "#fef2f2",
    advice: "More than twice the limit. Remove the worker from the area and investigate the source.",
  },
};
