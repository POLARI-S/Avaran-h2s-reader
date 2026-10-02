"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoButtons } from "@/components/DemoButtons";
import { ResultCard } from "@/components/ResultCard";
import { StatusPill } from "@/components/StatusPill";
import { DEMO_PHOTOS, demoTargetTwa, type DemoLevel } from "@/lib/demo";
import { loadCalibration } from "@/lib/calibration";
import { loadStandard } from "@/lib/settings";
import { appendRecord } from "@/lib/history";
import { DEFAULT_CAL, STANDARDS, classify, darkeningFromDose, type Calibration, type StandardKey } from "@/lib/dose";
import type { ScanRecord } from "@/lib/types";

// Either a sample patch photo (with a known exposure level) or the user's own photo.
type Photo = { kind: "demo"; level: DemoLevel; url: string } | { kind: "own"; url: string };

export default function ScanPage() {
  const [workerId, setWorkerId] = useState("");
  const [hours, setHours] = useState(8);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [cal, setCal] = useState<Calibration>(DEFAULT_CAL);
  const [std, setStd] = useState<StandardKey>("acgih");
  const [result, setResult] = useState<ScanRecord | null>(null);
  const [noModelOpen, setNoModelOpen] = useState(false);

  useEffect(() => {
    setCal(loadCalibration());
    setStd(loadStandard());
  }, []);

  const limitPpm = STANDARDS[std].twa;

  const pickDemo = (level: DemoLevel) => {
    setPhoto({ kind: "demo", level, url: DEMO_PHOTOS[level] });
    setResult(null);
    if (!workerId.trim() || workerId.startsWith("DEMO-")) {
      setWorkerId(`DEMO-${level.toUpperCase()}`);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto({ kind: "own", url: URL.createObjectURL(file) });
    setResult(null);
    e.target.value = "";
  };

  const analyse = () => {
    if (!photo) return;
    if (photo.kind === "own") {
      // No validated model yet: explain instead of guessing a ppm value.
      setNoModelOpen(true);
      return;
    }
    const twaPpm = demoTargetTwa(photo.level, limitPpm);
    const dose = twaPpm * hours;
    const record: ScanRecord = {
      id: crypto.randomUUID(),
      t: Date.now(),
      worker: (workerId || "UNKNOWN").trim(),
      hrs: hours,
      dA: +darkeningFromDose(dose, cal).toFixed(4),
      dose: +dose.toFixed(2),
      twa: +twaPpm.toFixed(3),
      band: classify(twaPpm, limitPpm).band,
      standard: std,
      demo: true,
      saturated: false,
      extrapolated: false,
      provisional: cal.provisional,
    };
    appendRecord(record);
    setResult(record);
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
            2 · Patch photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            See a sample wristband patch:
          </Label>
          <DemoButtons
            onSelect={pickDemo}
            limitPpm={limitPpm}
            selected={photo?.kind === "demo" ? photo.level : null}
          />

          <Label
            htmlFor="file"
            className="mt-3 flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center text-sm text-muted-foreground"
          >
            <b className="flex items-center gap-1.5 text-primary">
              <Camera className="size-4" strokeWidth={1.75} />
              Or take a photo of your patch
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

          {photo && (
            <>
              <div className="mt-3 overflow-hidden rounded-xl border bg-muted/30">
                <Image
                  data-testid="patch-photo"
                  src={photo.url}
                  alt={photo.kind === "demo" ? `Sample ${photo.level} patch` : "Your patch photo"}
                  width={1024}
                  height={1536}
                  className="mx-auto max-h-[420px] w-auto object-contain"
                />
              </div>
              {photo.kind === "demo" && (
                <p className="mt-1.5 text-center text-xs text-muted-foreground">
                  Left: worker&apos;s patch after the shift. Right: sealed reference patch.
                </p>
              )}
              <Button type="button" className="mt-3 h-11 w-full text-[15px] font-bold" onClick={analyse}>
                Analyse
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  3 · Result
                </CardTitle>
                <Badge variant="secondary">Sample</Badge>
              </span>
              <StatusPill band={band} />
            </div>
          </CardHeader>
          <CardContent>
            <ResultCard record={result} limitPpm={limitPpm} provisional={false} />
            <p className="mt-3 text-xs text-muted-foreground">
              Sample result, not a real worker. Saved to records for {result.worker} (marked demo).
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={noModelOpen} onOpenChange={setNoModelOpen}>
        <DialogContent>
          <DialogHeader>
            <FlaskConical className="size-7 text-primary" strokeWidth={1.75} />
            <DialogTitle>No patch detected yet</DialogTitle>
            <DialogDescription>
              Thanks for trying AVARAN! The app is still in development. We&apos;re building the lab dataset
              needed to train a precise model, so it can&apos;t estimate a ppm value from your own photos yet.
              Photo readings are coming soon.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            In the meantime, tap <b>Safe</b>, <b>Caution</b> or <b>Over limit</b> to see how a reading works on
            a real wristband patch.
          </p>
          <DialogFooter>
            <DialogClose render={<Button className="h-11 w-full" />}>Got it</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
