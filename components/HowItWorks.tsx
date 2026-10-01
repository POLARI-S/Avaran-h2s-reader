import { Camera, Scale, TrendingUp } from "lucide-react";
import { Fragment } from "react";

function FadeSwatch() {
  return (
    <div className="flex size-6 items-center justify-center gap-px overflow-hidden rounded-full border border-border">
      <div className="h-full w-1/2 bg-amber-400" />
      <div className="h-full w-1/2 bg-neutral-400" />
    </div>
  );
}

const STEPS = [
  { label: "Patch fades yellow → grey", render: () => <FadeSwatch /> },
  {
    label: "Photo at end of shift",
    render: () => (
      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Camera className="size-3.5" strokeWidth={1.75} />
      </div>
    ),
  },
  {
    label: "Colour change → total dose",
    render: () => (
      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TrendingUp className="size-3.5" strokeWidth={1.75} />
      </div>
    ),
  },
  {
    label: "Dose ÷ hours → TWA",
    render: () => (
      <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Scale className="size-3.5" strokeWidth={1.75} />
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <div>
      <div className="flex items-start">
        {STEPS.map((step, i) => (
          <Fragment key={step.label}>
            <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
              {step.render()}
              <span className="text-[10.5px] leading-tight text-muted-foreground">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="mt-3 h-px flex-1 bg-border" />}
          </Fragment>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        The wristband has <b>no battery and no electronics</b>. It records the <b>total H₂S dose</b> over
        the shift, not a live reading. Silver nanoparticles in the PVA film react with H₂S to form silver
        sulfide (2Ag + H₂S → Ag₂S), so the film loses its yellow colour and turns grey. The bigger the
        colour change, the more gas the worker was exposed to.
      </p>
    </div>
  );
}
