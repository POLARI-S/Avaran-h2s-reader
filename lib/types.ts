import type { Band, StandardKey } from "./dose";

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
};
