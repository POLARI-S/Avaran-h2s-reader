"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Layers, Ruler, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoButtons } from "@/components/DemoButtons";
import { ModeChooser, type ScanMode } from "@/components/ModeChooser";
import { TapCanvas, type TapCanvasHandle } from "@/components/TapCanvas";
import { ResultCard } from "@/components/ResultCard";
import { CalibrationPendingCard } from "@/components/CalibrationPendingCard";
import { StatusPill } from "@/components/StatusPill";
import { generateDemoImage, type DemoLevel } from "@/lib/demo";
import { loadCalibration } from "@/lib/calibration";
import { loadBoxPct, loadStandard } from "@/lib/settings";
import { appendRecord } from "@/lib/history";
import { isPendingResult } from "@/lib/pending";
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
  const [mode, setMode] = useState<ScanMode | null>(null);
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

  const clearScan = () => {
    setImageUrl(null);
    setInitialTaps(undefined);
    setTapCount(0);
    setResult(null);
    setWarning(undefined);
  };

  const chooseMode = (m: ScanMode) => {
    if (m === mode) return;
    clearScan();
    setIsDemo(m === "demo");
    setMode(m);
  };

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

    if (isPendingResult({ demo: isDemo }, cal)) {
      // Real photo while calibration is provisional: keep the measurement only.
      // dose/twa/band are placeholders and are never displayed for pending rows.
      const pendingRecord: ScanRecord = {
        id: crypto.randomUUID(),
        t: Date.now(),
        worker: (workerId || "UNKNOWN").trim(),
        hrs: hours,
        dA: +dA.toFixed(4),
        dose: 0,
        twa: 0,
        band: "SAFE",
        standard: std,
        demo: false,
        saturated: false,
        extrapolated: false,
        provisional: true,
        pending: true,
        channel: cal.channel,
      };
      appendRecord(pendingRecord);
      setResult(pendingRecord);
      setWarning(undefined);
      return;
    }

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
      setWarning("Worker patch shows less change than the reference — check the taps and the lighting.");
    } else if (doseResult.saturated) {
      setWarning("Patch is saturated — the true dose is at least this value.");
    } else if (doseResult.extrapolated) {
      setWarning("Beyond the calibrated dose range — treat as approximate.");
    } else {
      setWarning(undefined);
    }
  };

  const band = result && !result.pending ? classify(result.twa, limitPpm).band : null;

  const canvasAndAnalyse = imageUrl && (
    <>
      <TapCanvas
        ref={tapRef}
        imageUrl={imageUrl}
        boxPct={boxPct}
        initialTaps={initialTaps}
        onTapsChange={setTapCount}
      />
      <Button
        type="button"
        className="mt-2 h-11 w-full text-[15px] font-bold"
        disabled={tapCount < 3}
        onClick={analyse}
      >
        Analyse
      </Button>
    </>
  );

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
              <p className="mt-1 text-[11px] text-muted-foreground">
                Use a test ID like DEMO-01 when trying the demo.
              </p>
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

      <ModeChooser mode={mode} onSelect={chooseMode} />

      {mode === "demo" && (
        <Card>
          <CardContent>
            <p className="mb-3 text-sm">
              <b>Demo mode.</b> These are computer-generated patch images that show what a worker&apos;s patch
              looks like after a shift at three exposure levels. Pick one: the app places the three taps for
              you. Press <b>Analyse</b> to see the full pipeline: colour change → dose (ppm·h) → 8-hour
              average (TWA) → safety band.
            </p>
            <DemoButtons onSelect={loadDemo} limitPpm={limitPpm} />
            {canvasAndAnalyse}
          </CardContent>
        </Card>
      )}

      {mode === "real" && (
        <Card>
          <CardContent>
            {!imageUrl && (
              <div className="mb-3 rounded-xl border bg-muted/30 p-3 text-sm">
                <b className="mb-1.5 block">How to photograph the patch</b>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Layers className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                    <span>
                      Put three things in <b>one</b> photo: the <b>white card</b>, the{" "}
                      <b>sealed reference patch</b> (the unexposed control from the same batch), and the{" "}
                      <b>worker&apos;s patch</b>.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Sun className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                    <span>Lay them flat on a plain surface, in even indoor light.</span>
                  </li>
                  <li className="flex gap-2">
                    <Ruler className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                    <span>
                      Turn the flash <b>off</b> and avoid shadows and glare. Shoot straight down from about 20
                      cm.
                    </span>
                  </li>
                </ul>
              </div>
            )}
            <Label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center text-sm text-muted-foreground"
            >
              <b className="flex items-center gap-1.5 text-primary">
                <Camera className="size-4" strokeWidth={1.75} />
                Take photo or upload
              </b>
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
            {canvasAndAnalyse}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Result
              </CardTitle>
              {result.demo ? (
                <span className="flex items-center gap-1.5">
                  <Badge variant="secondary">Demo</Badge>
                  <span className="text-xs text-muted-foreground">Simulated patch</span>
                </span>
              ) : (
                !result.pending && <StatusPill band={band} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result.pending ? (
              <>
                <CalibrationPendingCard
                  dA={result.dA}
                  channel={result.channel ?? cal.channel}
                  onTryDemo={() => chooseMode("demo")}
                  onScanAnother={clearScan}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Measurement saved to records for {result.worker} (pending calibration).
                </p>
              </>
            ) : (
              <>
                {result.demo && <StatusPill band={band} className="mb-2" />}
                <ResultCard
                  record={result}
                  limitPpm={limitPpm}
                  provisional={result.provisional}
                  warning={warning}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  {result.demo
                    ? "Demo result: generated image, not a real worker. Saved to records marked 'demo'."
                    : `Saved to records for ${result.worker}.`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
