import { Button } from "@/components/ui/button";
import { demoTargetTwa, type DemoLevel } from "@/lib/demo";

const LEVELS: { level: DemoLevel; label: string }[] = [
  { level: "safe", label: "Safe" },
  { level: "caution", label: "Caution" },
  { level: "over", label: "Over limit" },
];

export function DemoButtons({
  onSelect,
  limitPpm,
  disabled,
}: {
  onSelect: (level: DemoLevel) => void;
  limitPpm: number;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LEVELS.map((l) => (
        <Button
          key={l.level}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onSelect(l.level)}
          className="h-auto flex-col gap-0 py-2"
        >
          <span>{l.label}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            ≈ {demoTargetTwa(l.level, limitPpm).toFixed(1)} ppm TWA
          </span>
        </Button>
      ))}
    </div>
  );
}
