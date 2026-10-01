"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_CAL, STANDARDS, type Calibration, type Channel, type StandardKey } from "@/lib/dose";
import {
  CalibrationImportError,
  loadCalibration,
  parseModelParams,
  resetCalibration,
  saveCalibration,
  validateCalibrationInput,
} from "@/lib/calibration";
import { loadBoxPct, loadStandard, saveBoxPct, saveStandard } from "@/lib/settings";

const CHANNEL_LABELS: Record<Channel, string> = {
  r: "Red (darkening)",
  g: "Green (darkening)",
  b: "Blue (darkening)",
  l: "Luminance (darkening)",
  kr: "Red (Kubelka-Munk)",
  kg: "Green (Kubelka-Munk)",
  kb: "Blue (Kubelka-Munk)",
  kl: "Luminance (Kubelka-Munk)",
  y: "Yellowness loss (Δb*)",
  e: "Total colour change (ΔE)",
};

export default function SetupPage() {
  const [loaded, setLoaded] = useState(false);
  const [std, setStd] = useState<StandardKey>("acgih");
  const [boxPct, setBoxPct] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  const [aInput, setAInput] = useState(String(DEFAULT_CAL.A));
  const [kInput, setKInput] = useState(String(DEFAULT_CAL.k));
  const [maxInput, setMaxInput] = useState(String(DEFAULT_CAL.doseMax));
  const [channel, setChannel] = useState<Channel>(DEFAULT_CAL.channel);
  const [provisional, setProvisional] = useState(DEFAULT_CAL.provisional);

  useEffect(() => {
    const c = loadCalibration();
    setAInput(String(c.A));
    setKInput(String(c.k));
    setMaxInput(String(c.doseMax));
    setChannel(c.channel);
    setProvisional(c.provisional);
    setStd(loadStandard());
    setBoxPct(loadBoxPct());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const onStdChange = (value: StandardKey | null) => {
    if (!value) return;
    setStd(value);
    saveStandard(value);
  };

  const onBoxChange = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? value[0] : (value as number);
    setBoxPct(v);
    saveBoxPct(v);
  };

  const applyCalibration = (next: Calibration) => {
    setAInput(String(next.A));
    setKInput(String(next.k));
    setMaxInput(String(next.doseMax));
    setChannel(next.channel);
    setProvisional(next.provisional);
  };

  const onSaveCal = () => {
    const A = parseFloat(aInput);
    const k = parseFloat(kInput);
    const doseMax = parseFloat(maxInput);
    const error = validateCalibrationInput({ A, k, doseMax });
    if (error) {
      setMessage(error);
      return;
    }
    const next: Calibration = { model: "saturating_exponential", A, k, channel, doseMax, provisional };
    saveCalibration(next);
    setMessage("Calibration saved.");
  };

  const onReset = () => {
    const next = resetCalibration();
    applyCalibration(next);
    setMessage("Reset to provisional defaults.");
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const json = JSON.parse(text);
        const next = parseModelParams(json, loadCalibration());
        saveCalibration(next);
        applyCalibration(next);
        setMessage(`Imported: A=${next.A.toFixed(4)}, k=${next.k.toFixed(5)}`);
      })
      .catch((err) => {
        const msg = err instanceof CalibrationImportError ? err.message : "Could not read that file.";
        setMessage("Could not import: " + msg);
      });
    e.target.value = "";
  };

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Exposure standard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={std} onValueChange={onStdChange}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue>{(value: StandardKey | null) => (value ? STANDARDS[value].label : "")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STANDARDS).map(([key, s]) => (
                <SelectItem key={key} value={key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            The stricter ACGIH value is recommended for worker protection; the Factories Act value is the Indian
            statutory limit. Verify against the current schedule before deployment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Calibration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            From the lab fit: ΔA = A · (1 − e<sup>−k·D</sup>). Paste the two numbers from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[12.5px]">model_params.json</code>, or import the
            file.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="calA" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                A (saturation)
              </Label>
              <Input
                id="calA"
                type="number"
                step="0.0001"
                value={aInput}
                onChange={(e) => setAInput(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label htmlFor="calK" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                k (per ppm·h)
              </Label>
              <Input
                id="calK"
                type="number"
                step="0.00001"
                value={kInput}
                onChange={(e) => setKInput(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Colour channel</Label>
              <Select value={channel} onValueChange={(v) => v && setChannel(v as Channel)}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue>{(value: Channel | null) => (value ? CHANNEL_LABELS[value] : "")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="calMax" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Max calibrated dose
              </Label>
              <Input
                id="calMax"
                type="number"
                step="0.1"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-sm">
            <Switch checked={provisional} onCheckedChange={setProvisional} />
            Mark readings as provisional
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Button className="h-11" onClick={onSaveCal}>
              Save calibration
            </Button>
            <Label
              htmlFor="jsonIn"
              className="flex h-11 cursor-pointer items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground"
            >
              Import JSON
            </Label>
          </div>
          <input id="jsonIn" type="file" accept=".json,application/json" className="hidden" onChange={onImport} />
          <Button variant="outline" className="mt-2.5 h-11 w-full" onClick={onReset}>
            Reset to defaults
          </Button>
          {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Sample size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
            Measured area around each tap: <span className="text-foreground">{boxPct}</span>% of photo width
          </Label>
          <Slider value={[boxPct]} min={2} max={12} step={0.5} onValueChange={onBoxChange} />
        </CardContent>
      </Card>
    </div>
  );
}
