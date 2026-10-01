import { BAND_META, type Band } from "@/lib/dose";

export function LimitBar({ frac, band, limitPpm }: { frac: number; band: Band; limitPpm: number }) {
  const width = Math.min(100, frac * 50);
  const color = BAND_META[band].color;
  return (
    <div className="mt-3">
      <div className="relative h-2.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
        <div className="absolute top-[-5px] bottom-[-5px] left-1/2 w-0.5 bg-foreground/40" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>0</span>
        <span>limit {limitPpm} ppm</span>
        <span>2× limit</span>
      </div>
    </div>
  );
}
