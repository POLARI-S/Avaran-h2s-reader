import type { Channel } from "./dose";

export const CHANNEL_LABELS: Record<Channel, string> = {
  r: "Red (darkening)",
  g: "Green (darkening)",
  b: "Blue (darkening)",
  l: "Luminance (darkening)",
  kr: "Red (Kubelka-Munk)",
  kg: "Green (Kubelka-Munk)",
  kb: "Blue (Kubelka-Munk)",
  kl: "Luminance (Kubelka-Munk)",
  y: "Yellowness loss (Δb*)",
  e: "Total colour change (ΔE)",
};
