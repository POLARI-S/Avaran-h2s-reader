import { Button } from "@/components/ui/button";
import type { DemoLevel } from "@/lib/demo";

const LEVELS: { level: DemoLevel; label: string }[] = [
  { level: "safe", label: "Safe" },
  { level: "caution", label: "Caution" },
  { level: "over", label: "Over limit" },
];

export function DemoButtons({
  onSelect,
  disabled,
}: {
  onSelect: (level: DemoLevel) => void;
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
          className="h-10"
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
