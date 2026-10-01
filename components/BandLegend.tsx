import { BAND_META, type Band } from "@/lib/dose";

const ROWS: { band: Band; desc: string; range: (limit: number) => string }[] = [
  { band: "SAFE", desc: "below 50% of the shift limit", range: (l) => `< ${fmt(l * 0.5)} ppm` },
  {
    band: "CAUTION",
    desc: "50–100% of the limit — check the area",
    range: (l) => `${fmt(l * 0.5)}–${fmt(l)} ppm`,
  },
  {
    band: "OVER LIMIT",
    desc: "above the limit — report to safety officer",
    range: (l) => `${fmt(l)}–${fmt(l * 2)} ppm`,
  },
  { band: "HIGH", desc: "over 2× the limit — remove and investigate", range: (l) => `> ${fmt(l * 2)} ppm` },
];

function fmt(v: number) {
  return v < 5 ? v.toFixed(1) : v.toFixed(0);
}

export function BandLegend({ limitPpm, standardLabel }: { limitPpm: number; standardLabel: string }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{standardLabel}</p>
      <div className="space-y-2">
        {ROWS.map((row) => {
          const meta = BAND_META[row.band];
          return (
            <div
              key={row.band}
              data-testid={`legend-${row.band.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: meta.softColor }}
            >
              <div>
                <b style={{ color: meta.color }} className="text-sm font-bold">
                  {row.band}
                </b>
                <p className="text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                {row.range(limitPpm)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
