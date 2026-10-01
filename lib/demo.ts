import { darkeningFromDose, linearToSrgb, srgbToLinear, type Calibration } from "./dose";

export type DemoLevel = "safe" | "caution" | "over";

export type DemoTap = { x: number; y: number };

export type DemoImage = {
  dataUrl: string;
  width: number;
  height: number;
  taps: [DemoTap, DemoTap, DemoTap]; // white card, reference, worker patch
};

const WIDTH = 1200;
const HEIGHT = 800;
const WHITE_RGB: [number, number, number] = [238, 238, 234];
const REFERENCE_RGB: [number, number, number] = [201, 146, 58];

// Fraction of the current standard's limit each demo level targets.
const LEVEL_FRACTION: Record<DemoLevel, number> = { safe: 0.3, caution: 0.8, over: 1.5 };

/**
 * Generates a synthetic cartridge photo by running the CURRENT calibration
 * forward (target TWA -> dose -> darkening -> patch colour), so the demo
 * exercises the exact same analysis pipeline a real scan would use rather
 * than presenting a fabricated answer.
 */
export function generateDemoImage(
  level: DemoLevel,
  limitPpm: number,
  shiftHours: number,
  cal: Calibration,
): DemoImage {
  const targetTwa = LEVEL_FRACTION[level] * limitPpm;
  const targetDose = targetTwa * shiftHours;
  const dA = darkeningFromDose(targetDose, cal);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  ctx.fillStyle = "#3a3d42";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const patchRgb: [number, number, number] = REFERENCE_RGB.map((v) =>
    linearToSrgb(srgbToLinear(v) * Math.pow(10, -dA)),
  ) as [number, number, number];

  const paintSwatch = (rgb: [number, number, number], x: number, y: number, size: number) => {
    ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    ctx.fillRect(x, y, size, size);
    // mild per-pixel noise so the demo photo isn't a flat, obviously-fake swatch
    const imgData = ctx.getImageData(x, y, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 6;
      imgData.data[i] += n;
      imgData.data[i + 1] += n;
      imgData.data[i + 2] += n;
    }
    ctx.putImageData(imgData, x, y);
  };

  paintSwatch(WHITE_RGB, 110, 120, 260);
  paintSwatch(REFERENCE_RGB, 830, 120, 260);
  paintSwatch(patchRgb, 470, 450, 260);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("WHITE CARD", 130, 425);
  ctx.fillText("REFERENCE", 865, 425);
  ctx.fillText("WORKER PATCH — DEMO", 430, 755);

  return {
    dataUrl: canvas.toDataURL(),
    width: WIDTH,
    height: HEIGHT,
    taps: [
      { x: 240, y: 250 },
      { x: 960, y: 250 },
      { x: 600, y: 580 },
    ],
  };
}
