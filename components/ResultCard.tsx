import { BAND_META, classify } from "@/lib/dose";
import type { ScanRecord } from "@/lib/types";
import { LimitBar } from "./LimitBar";

export function ResultCard({
  record,
  limitPpm,
  provisional,
  warning,
}: {
  record: ScanRecord;
  limitPpm: number;
  provisional: boolean;
  warning?: string;
}) {
  const { band, frac } = classify(record.twa, limitPpm);
  const meta = BAND_META[band];

  return (
    <div>
      <div className="flex items-baseline justify-center gap-1.5">
        <b data-testid="result-twa" className="text-5xl font-bold tabular-nums tracking-tight">
          {record.twa < 10 ? record.twa.toFixed(2) : record.twa.toFixed(1)}
        </b>
        <span className="font-semibold text-muted-foreground">ppm · 8-h average (TWA)</span>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Shift dose <b className="text-foreground">{record.dose.toFixed(1)}</b> ppm·h over {record.hrs} h
      </p>
      <LimitBar frac={frac} band={band} limitPpm={limitPpm} />
      <div className="mt-3 rounded-xl p-3 text-sm" style={{ backgroundColor: meta.softColor }}>
        <strong
          data-testid="result-band"
          className="mb-0.5 block text-xs font-bold tracking-wide"
          style={{ color: meta.color }}
        >
          {band}
        </strong>
        <span>{meta.advice}</span>
      </div>
      {warning && (
        <div
          data-testid="result-warning"
          className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          {warning}
        </div>
      )}
      {provisional && (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
          Provisional calibration — laboratory validation in progress.
        </div>
      )}
    </div>
  );
}
