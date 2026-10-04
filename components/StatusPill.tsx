import { BAND_META, type Band } from "@/lib/dose";
import { cn } from "@/lib/utils";

export function StatusPill({ band, className }: { band: Band | null; className?: string }) {
  if (!band) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-bold tracking-wide text-muted-foreground",
          className,
        )}
      >
        —
      </span>
    );
  }
  const meta = BAND_META[band];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.06em] transition-colors duration-300", className)}
      style={{ backgroundColor: meta.softColor, color: meta.color }}
    >
      {band}
    </span>
  );
}
