import { Camera, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ScanMode = "demo" | "real";

const MODES = [
  {
    mode: "demo" as const,
    Icon: PlayCircle,
    title: "Try a demo",
    subtitle: "See the full reading pipeline on sample patches. No wristband needed.",
  },
  {
    mode: "real" as const,
    Icon: Camera,
    title: "Scan a real patch",
    subtitle: "Photograph a worn patch. Calibration in progress (beta).",
  },
];

export function ModeChooser({ mode, onSelect }: { mode: ScanMode | null; onSelect: (m: ScanMode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 max-[380px]:grid-cols-1">
      {MODES.map(({ mode: m, Icon, title, subtitle }) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onSelect(m)}
          className={cn(
            "flex flex-col items-start gap-1.5 rounded-2xl border bg-card p-3.5 text-left transition-colors hover:bg-muted/40",
            mode === m && "ring-2 ring-primary",
          )}
        >
          <span className="flex w-full items-center justify-between">
            <Icon className="size-6 text-primary" strokeWidth={1.75} />
            {m === "real" && <Badge variant="secondary">Beta</Badge>}
          </span>
          <b className="text-[15px]">{title}</b>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </button>
      ))}
    </div>
  );
}
