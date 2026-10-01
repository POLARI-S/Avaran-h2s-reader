"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoButtons } from "@/components/DemoButtons";
import { TapCanvas, type TapCanvasHandle } from "@/components/TapCanvas";
import { ResultCard } from "@/components/ResultCard";
import { StatusPill } from "@/components/StatusPill";
import { generateDemoImage, type DemoLevel } from "@/lib/demo";
import { loadCalibration } from "@/lib/calibration";
import { loadBoxPct, loadStandard } from "@/lib/settings";
import { appendRecord } from "@/lib/history";
import {
  DEFAULT_CAL,
  STANDARDS,
  classify,
  darkening,
  doseFromDarkening,
  twa,
  type Calibration,
  type StandardKey,
} from "@/lib/dose";
import type { ScanRecord } from "@/lib/types";

type Tap = { x: number; y: number };

export default function ScanPage() {
  const [workerId, setWorkerId] = useState("");
  const [hours, setHours] = useState(8);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [initialTaps, setInitialTaps] = useState<[Tap, Tap, Tap] | undefined>();
  const [tapCount, setTapCount] = useState(0);
  const [cal, setCal] = useState<Calibration>(DEFAULT_CAL);
  const [std, setStd] = useState<StandardKey>("acgih");
  const [boxPct, setBoxPct] = useState(5);
  const [result, setResult] = useState<ScanRecord | null>(null);
  const [warning, setWarning] = useState<string | undefined>();
  const tapRef = useRef<TapCanvasHandle>(null);

  useEffect(() => {
    setCal(loadCalibration());
    setStd(loadStandard());
    setBoxPct(loadBoxPct());
  }, []);

  const limitPpm = STANDARDS[std].twa;

  const loadDemo = (level: DemoLevel) => {
    const demo = generateDemoImage(level, limitPpm, hours, cal);
    setImageUrl(demo.dataUrl);
    setIsDemo(true);
    setInitialTaps(demo.taps);
    setResult(null);
    setWarning(undefined);
    if (!workerId.trim() || workerId.startsWith("DEMO-")) {
      setWorkerId(`DEMO-${level.toUpperCase()}`);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setIsDemo(false);
    setInitialTaps(undefined);
    setResult(null);
    setWarning(undefined);
    e.target.value = "";
  };

  const analyse = () => {
    const samples = tapRef.current?.sample(boxPct);
    if (!samples) return;
    const [white, reference, patch] = samples;
    const dA = darkening(white, reference, patch, cal.channel);
    const doseResult = doseFromDarkening(dA, cal);
    const twaPpm = twa(doseResult.dose, hours);
    const record: ScanRecord = {
      id: crypto.randomUUID(),
      t: Date.now(),
      worker: (workerId || "UNKNOWN").trim(),
      hrs: hours,
      dA: +dA.toFixed(4),
      dose: +doseResult.dose.toFixed(2),
      twa: +twaPpm.toFixed(3),
      band: classify(twaPpm, limitPpm).band,
      standard: std,
      demo: isDemo,
      saturated: doseResult.saturated,
      extrapolated: doseResult.extrapolated,
      provisional: cal.provisional,
    };
    appendRecord(record);
    setResult(record);

    if (dA < 0) {
      setWarning("Worker patch reads lighter than the reference — check the taps and the lighting.");
    } else if (doseResult.saturated) {
      setWarning("Patch is saturated — the true dose is at least this value.");
    } else if (doseResult.extrapolated) {
      setWarning("Beyond the calibrated dose range — treat as approximate.");
    } else {
      setWarning(undefined);
    }
  };

  const band = result ? classify(result.twa, limitPpm).band : null;

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            1 · Worker &amp; shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="workerId" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Worker ID
              </Label>
              <Input
                id="workerId"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="e.g. MRPL-0142"
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="hours" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Shift length (h)
              </Label>
              <Input
                id="hours"
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 8)}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            2 · Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            In one photo, place the <b>white card</b>, the <b>reference patch</b> (sealed control) and the{" "}
            <b>worker&apos;s patch</b>. Flat, flash off, no shadows.
          </p>
          <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            No patch yet? Try a demo image:
          </Label>
          <DemoButtons onSelect={loadDemo} />

          <Label
            htmlFor="file"
            className="mt-3 flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center text-sm text-muted-foreground"
          >
            <b className="text-primary">Take photo or upload</b>
            <span className="text-xs">Camera opens on phones</span>
          </Label>
          <input
            id="file"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFile}
          />

          {imageUrl && (
            <TapCanvas
              ref={tapRef}
              imageUrl={imageUrl}
              boxPct={boxPct}
              initialTaps={initialTaps}
              onTapsChange={setTapCount}
            />
          )}
          {imageUrl && (
            <Button
              type="button"
              className="mt-2 h-11 w-full text-[15px] font-bold"
              disabled={tapCount < 3}
              onClick={analyse}
            >
              Analyse
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                3 · Result
              </CardTitle>
              <StatusPill band={band} />
            </div>
          </CardHeader>
          <CardContent>
            <ResultCard record={result} limitPpm={limitPpm} provisional={result.provisional} warning={warning} />
            <p className="mt-3 text-xs text-muted-foreground">
              Saved to records for {result.worker}
              {result.demo ? " (demo image)" : ""}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
