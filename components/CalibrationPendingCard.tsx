import { CheckCircle2, Clock, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABELS } from "@/lib/channels";
import type { Channel } from "@/lib/dose";

const STEPS = [
  { done: true, text: "Patch chemistry and colour measurement: working" },
  { done: false, text: "Controlled-exposure dataset: in progress" },
  { done: false, text: "Calibrated dose + TWA for real patches: coming soon" },
];

/** Measured colour change only; shown for real photos while calibration is provisional. */
export function CalibrationPendingCard({
  dA,
  channel,
  onTryDemo,
  onScanAnother,
  compact,
}: {
  dA: number;
  channel: Channel;
  onTryDemo?: () => void;
  onScanAnother?: () => void;
  compact?: boolean;
}) {
  return (
    <div data-testid="calibration-pending">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
        <b className="flex-1 text-sm">Reading captured: calibration in progress</b>
        <Badge variant="secondary">Beta</Badge>
      </div>

      <div className="mt-3 text-center">
        <b data-testid="pending-da" className="block text-5xl font-bold tabular-nums tracking-tight">
          {dA.toFixed(3)}
        </b>
        <span className="text-sm font-semibold text-muted-foreground">{CHANNEL_LABELS[channel]}</span>
        <p className="mt-1 text-xs text-muted-foreground">
          Colour change of the worker patch relative to the sealed reference, normalised to the white card.
        </p>
        {dA <= 0 && <p className="mt-2 text-sm">No colour change detected. The patch matches the reference.</p>}
        {dA < -0.02 && (
          <p className="mt-1 text-xs text-amber-900">
            The patch shows less change than the reference: check the taps and lighting.
          </p>
        )}
      </div>

      {!compact && (
        <>
          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
            <b className="mb-1 block">Why there&apos;s no ppm number yet</b>
            <p className="text-xs leading-relaxed">
              The phone has measured how much this patch has changed colour, and that part works today. Turning
              colour change into an exact H₂S dose needs a <b>calibration curve</b>: patches exposed to known
              H₂S doses in a controlled chamber, then fitted with a model. Team AVARAN is collecting that
              dataset in the lab now.
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              Until the curve is validated, we show the raw measurement only.{" "}
              <b>We will not guess a value that could mislead a worker or safety officer.</b>
            </p>
          </div>

          <div className="mt-3">
            <b className="mb-1.5 block text-xs tracking-wide text-muted-foreground uppercase">
              What happens next
            </b>
            <ul className="space-y-1.5">
              {STEPS.map((s) => (
                <li key={s.text} className="flex items-start gap-2 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={1.75} />
                  ) : (
                    <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  )}
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {(onTryDemo || onScanAnother) && (
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {onTryDemo && (
            <Button type="button" className="h-11" onClick={onTryDemo}>
              Try the demo instead
            </Button>
          )}
          {onScanAnother && (
            <Button type="button" variant="outline" className="h-11" onClick={onScanAnother}>
              Scan another patch
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
