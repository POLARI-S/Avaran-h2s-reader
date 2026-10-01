const STEPS = [
  { icon: "🟫", label: "Patch darkens with H₂S" },
  { icon: "📷", label: "Photo at end of shift" },
  { icon: "∫", label: "Darkening → total dose" },
  { icon: "⚖", label: "Dose ÷ hours → TWA" },
];

export function HowItWorks() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
        {STEPS.map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/40 px-1 py-2">
            <div className="text-lg">{s.icon}</div>
            <div className="mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        The wristband has <b>no battery and no electronics</b>. It records the <b>total H₂S dose</b> over
        the shift, not a live reading. Silver nanoparticles in the PVA film turn into dark silver sulfide
        (2Ag + H₂S → Ag₂S); the darker it gets, the more gas the worker was exposed to.
      </p>
    </div>
  );
}
