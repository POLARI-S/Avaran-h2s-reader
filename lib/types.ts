import type { Band, Channel, StandardKey } from "./dose";

export type ScanRecord = {
  id: string;
  t: number; // epoch ms
  worker: string;
  hrs: number;
  dA: number;
  dose: number;
  twa: number;
  band: Band;
  standard: StandardKey;
  demo: boolean;
  saturated: boolean;
  extrapolated: boolean;
  provisional: boolean;
  // Real photo taken while the calibration is provisional: only dA is
  // meaningful; dose/twa/band are placeholders and must never be displayed.
  pending?: boolean;
  channel?: Channel; // colour channel dA was measured on (set for pending scans)
};
