import type { Calibration } from "./dose";

/**
 * A real-photo scan has no trustworthy dose until the calibration curve has
 * been validated in the lab (provisional switched off). Demo images are
 * generated from the current curve, so they always get a full result.
 */
export function isPendingResult(record: { demo: boolean }, cal: Pick<Calibration, "provisional">): boolean {
  return !record.demo && cal.provisional;
}
