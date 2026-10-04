import { BAND_META, type Band } from "@/lib/dose";

export function LimitBar({ frac, band, limitPpm }: { frac: number; band: Band; limitPpm: number }) {
  const width = Math.min(100, frac * 50);
  const color = BAND_META[band].color;
  return (
    <div className="mt-3">
      <div className="relative h-2.5 rounded-full bg-[oklch(0.45_0.06_265/0.1)] shadow-[inset_0_1px_2px_oklch(0.2_0.03_265/0.12)]">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-[var(--dur-spring)] ease-[var(--ease-spring)]"
          style={{ width: `${width}%`, backgroundColor: color }}
        >
          <div className="bar-grow h-full rounded-full shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]" style={{ backgroundColor: color }} />
        </div>
        <div className="absolute top-[-5px] bottom-[-5px] left-1/2 w-0.5 rounded-full bg-foreground/40" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>limit {limitPpm} ppm</span>
        <span>2× limit</span>
      </div>
    </div>
  );
}
