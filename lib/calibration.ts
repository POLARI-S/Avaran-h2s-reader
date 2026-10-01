import { DEFAULT_CAL, type Calibration, type Channel } from "./dose";
import { storage } from "./storage";

export class CalibrationImportError extends Error {}

const CHANNEL_SUFFIX: Record<string, Channel> = { R: "r", G: "g", B: "b", L: "l" };

/** Shape produced by fit_model.py. */
export type ModelParamsJson = {
  model?: string;
  params: [number, number]; // [A, k]
  metric?: string; // e.g. "dA_B" -> channel "b"
  dose_max?: number;
  r2?: number;
  n_points?: number;
};

export function parseModelParams(json: unknown, base: Calibration = DEFAULT_CAL): Calibration {
  if (typeof json !== "object" || json === null) {
    throw new CalibrationImportError("Not a valid calibration file.");
  }
  const j = json as ModelParamsJson;
  if (j.model && j.model !== "saturating_exponential") {
    throw new CalibrationImportError(
      `Model is "${j.model}" — this app expects the saturating exponential model.`,
    );
  }
  if (!Array.isArray(j.params) || j.params.length < 2) {
    throw new CalibrationImportError("Missing params [A, k] in the calibration file.");
  }
  const [A, k] = j.params;
  if (!(A > 0) || !(k > 0)) {
    throw new CalibrationImportError("A and k must both be positive numbers.");
  }
  const suffix = (j.metric ?? "dA_B").slice(-1).toUpperCase();
  const channel = CHANNEL_SUFFIX[suffix] ?? base.channel;
  return {
    model: "saturating_exponential",
    A,
    k,
    channel,
    doseMax: j.dose_max ?? base.doseMax,
    provisional: base.provisional,
  };
}

export function validateCalibrationInput(input: { A: number; k: number; doseMax: number }): string | null {
  if (!(input.A > 0)) return "A, k and max dose must all be positive.";
  if (!(input.k > 0)) return "A, k and max dose must all be positive.";
  if (!(input.doseMax > 0)) return "A, k and max dose must all be positive.";
  return null;
}

export function loadCalibration(): Calibration {
  return storage.get<Calibration>("cal", DEFAULT_CAL);
}

export function saveCalibration(cal: Calibration): void {
  storage.set("cal", cal);
}

export function resetCalibration(): Calibration {
  saveCalibration(DEFAULT_CAL);
  return DEFAULT_CAL;
}
