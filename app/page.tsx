"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { ResultCard } from "@/components/ResultCard";
import { HowItWorks } from "@/components/HowItWorks";
import { BandLegend } from "@/components/BandLegend";
import { loadHistory } from "@/lib/history";
import { loadCalibration } from "@/lib/calibration";
import { loadStandard } from "@/lib/settings";
import { classify, STANDARDS } from "@/lib/dose";
import type { ScanRecord } from "@/lib/types";
import type { StandardKey } from "@/lib/dose";

export default function DashboardPage() {
  const [history, setHistory] = useState<ScanRecord[] | null>(null);
  const [std, setStd] = useState<StandardKey>("acgih");
  const [provisional, setProvisional] = useState(true);

  useEffect(() => {
    setHistory(loadHistory());
    setStd(loadStandard());
    setProvisional(loadCalibration().provisional);
  }, []);

  if (history === null) return null;

  const last = history[history.length - 1] as ScanRecord | undefined;
  const limitPpm = STANDARDS[std].twa;
  const today = new Date().toDateString();
  const todays = history.filter((h) => new Date(h.t).toDateString() === today);
  const overToday = todays.filter((h) => classify(h.twa, limitPpm).frac >= 1).length;
  const band = last ? classify(last.twa, limitPpm).band : null;

  return (
    <div className="space-y-3.5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Latest shift reading
            </CardTitle>
            <StatusPill band={band} />
          </div>
        </CardHeader>
        <CardContent>
          {!last ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No scans yet.
              <br />
              Scan a worker&apos;s patch at the end of the shift.
            </p>
          ) : (
            <div>
              <p className="text-center text-sm text-muted-foreground">
                {last.worker} ·{" "}
                {new Date(last.t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                {last.demo ? " · demo" : ""}
              </p>
              <ResultCard record={last} limitPpm={limitPpm} provisional={provisional} />
            </div>
          )}
          <Button
            render={<Link href="/scan/" />}
            nativeButton={false}
            className="mt-3.5 h-11 w-full text-[15px] font-bold"
          >
            📷 Scan a patch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Today at a glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border bg-muted/30 p-2.5 text-center">
              <b className="block text-[22px] tabular-nums">{todays.length}</b>
              <span className="text-xs text-muted-foreground">patches scanned</span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-2.5 text-center">
              <b className="block text-[22px] tabular-nums">{overToday}</b>
              <span className="text-xs text-muted-foreground">above shift limit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            How the reading works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HowItWorks />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Status bands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BandLegend limitPpm={limitPpm} standardLabel={STANDARDS[std].label} />
        </CardContent>
      </Card>
    </div>
  );
}
