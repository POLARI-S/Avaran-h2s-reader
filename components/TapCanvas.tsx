"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { sampleLinearRGB, type Lin } from "@/lib/dose";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TapCanvasHandle = {
  sample: (boxPct: number) => [Lin, Lin, Lin] | null;
  reset: () => void;
};

type Tap = { x: number; y: number };

const TAP_COLORS = ["#475569", "#2563eb", "#dc2626"];
const HINTS = [
  "Tap the centre of the white card.",
  "Tap the centre of the reference patch.",
  "Tap the centre of the worker's patch.",
  "All set — press Analyse.",
];
const LABELS = ["① White card", "② Reference", "③ Worker patch"];

export const TapCanvas = forwardRef<
  TapCanvasHandle,
  {
    imageUrl: string;
    boxPct: number;
    initialTaps?: [Tap, Tap, Tap];
    onTapsChange?: (count: number) => void;
  }
>(function TapCanvas({ imageUrl, boxPct, initialTaps, onTapsChange }, ref) {
  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const [taps, setTaps] = useState<Tap[]>([]);
  const [, setReady] = useState(false);

  useEffect(() => {
    if (!srcRef.current) srcRef.current = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const src = srcRef.current!;
      src.width = Math.round(img.width * scale);
      src.height = Math.round(img.height * scale);
      const sctx = src.getContext("2d", { willReadFrequently: true })!;
      sctx.drawImage(img, 0, 0, src.width, src.height);
      if (viewRef.current) {
        viewRef.current.width = src.width;
        viewRef.current.height = src.height;
      }
      setTaps(initialTaps ? [...initialTaps] : []);
      setReady(true);
    };
    img.src = imageUrl;
    // Only the image identity should reset the loaded photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    const src = srcRef.current;
    const view = viewRef.current;
    if (!src || !view || src.width === 0) return;
    const vctx = view.getContext("2d")!;
    vctx.drawImage(src, 0, 0);
    const half = (src.width * boxPct) / 200;
    taps.forEach((p, i) => {
      vctx.lineWidth = Math.max(3, src.width / 250);
      vctx.strokeStyle = "#fff";
      vctx.strokeRect(p.x - half - 2, p.y - half - 2, half * 2 + 4, half * 2 + 4);
      vctx.strokeStyle = TAP_COLORS[i];
      vctx.strokeRect(p.x - half, p.y - half, half * 2, half * 2);
      vctx.fillStyle = TAP_COLORS[i];
      vctx.font = `bold ${Math.round(src.width / 28)}px system-ui`;
      vctx.fillText(String(i + 1), p.x - half, p.y - half - 8);
    });
    onTapsChange?.(taps.length);
    // onTapsChange identity is not meant to retrigger a redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taps, boxPct]);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => setTaps([]),
      sample: (pct) => {
        const src = srcRef.current;
        if (!src || taps.length < 3) return null;
        const sctx = src.getContext("2d", { willReadFrequently: true })!;
        const half = (src.width * pct) / 200;
        const inset = half * 0.2; // sample only the centre ~60% of the tap box, to avoid edges
        const size = Math.max(1, Math.round((half - inset) * 2));
        const results = taps.slice(0, 3).map((p) => {
          const x = Math.min(Math.max(0, Math.round(p.x - half + inset)), src.width - size);
          const y = Math.min(Math.max(0, Math.round(p.y - half + inset)), src.height - size);
          const data = sctx.getImageData(x, y, size, size).data;
          return sampleLinearRGB(data);
        });
        return results as [Lin, Lin, Lin];
      },
    }),
    [taps],
  );

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (taps.length >= 3 || !viewRef.current || !srcRef.current || srcRef.current.width === 0) return;
    const rect = viewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * srcRef.current.width) / rect.width;
    const y = ((e.clientY - rect.top) * srcRef.current.height) / rect.height;
    setTaps((t) => [...t, { x, y }]);
  };

  const hintIndex = Math.min(taps.length, 3);

  return (
    <div>
      <canvas
        ref={viewRef}
        onClick={handleClick}
        data-testid="tap-canvas"
        className="mt-2 w-full touch-manipulation rounded-xl bg-neutral-900"
      />
      <div className="mt-2 flex gap-1.5">
        {LABELS.map((label, i) => (
          <span
            key={label}
            className={cn(
              "flex-1 rounded-lg border-2 border-transparent bg-muted px-1 py-1.5 text-center text-xs font-bold text-muted-foreground",
              i === taps.length && "border-current bg-background",
              i < taps.length && "text-foreground",
            )}
            style={i === taps.length ? { color: TAP_COLORS[i] } : undefined}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{HINTS[hintIndex]}</p>
      <Button type="button" variant="outline" className="mt-2 h-10 w-full" onClick={() => setTaps([])}>
        Redo taps
      </Button>
    </div>
  );
});
