import { Button } from "@/components/ui/button";
import { demoTargetTwa, type DemoLevel } from "@/lib/demo";
import { cn } from "@/lib/utils";

const LEVELS: { level: DemoLevel; label: string }[] = [
  { level: "safe", label: "Safe" },
  { level: "caution", label: "Caution" },
  { level: "over", label: "Over limit" },
];

export function DemoButtons({
  onSelect,
  limitPpm,
  selected,
  disabled,
}: {
  onSelect: (level: DemoLevel) => void;
  limitPpm: number;
  selected?: DemoLevel | null;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LEVELS.map((l) => (
        <Button
          key={l.level}
          type="button"
          variant="outline"
          aria-pressed={selected === l.level}
          disabled={disabled}
          onClick={() => onSelect(l.level)}
          className={cn(
            "h-auto flex-col gap-0.5 rounded-xl py-2.5",
            selected === l.level && "border-primary bg-primary/10 text-primary ring-2 ring-primary",
          )}
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
