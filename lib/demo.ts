export type DemoLevel = "safe" | "caution" | "over";

// Fraction of the current standard's limit each demo level targets.
export const LEVEL_FRACTION: Record<DemoLevel, number> = { safe: 0.3, caution: 0.8, over: 1.5 };

/** Target 8-h TWA (ppm) a demo level aims for under the given limit. */
export const demoTargetTwa = (level: DemoLevel, limitPpm: number): number => LEVEL_FRACTION[level] * limitPpm;

/** Photos of real AVARAN wristband patches: worker patch (left) beside the sealed reference (right). */
export const DEMO_PHOTOS: Record<DemoLevel, string> = {
  safe: "/demo/patch-safe.jpg",
  caution: "/demo/patch-caution.jpg",
  over: "/demo/patch-over.jpg",
};
