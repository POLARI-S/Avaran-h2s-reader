"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { clearHistory, loadHistory } from "@/lib/history";
import { loadStandard } from "@/lib/settings";
import { STANDARDS, classify, type StandardKey } from "@/lib/dose";
import { csvCell } from "@/lib/csv";
import type { ScanRecord } from "@/lib/types";

export default function RecordsPage() {
  const [history, setHistory] = useState<ScanRecord[] | null>(null);
  const [std, setStd] = useState<StandardKey>("acgih");
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setStd(loadStandard());
  }, []);

  if (history === null) return null;

  const limitPpm = STANDARDS[std].twa;
  const filtered = [...history]
    .reverse()
    .filter((h) => h.worker.toLowerCase().includes(filter.trim().toLowerCase()));

  const exportCsv = () => {
    const head = "time,worker,shift_h,dA,dose_ppm_h,twa_ppm,status,standard,demo,provisional";
    const rows = history.map((h) =>
      [
        new Date(h.t).toISOString(),
        h.worker,
        h.hrs,
        h.dA,
        h.dose,
        h.twa,
        classify(h.twa, limitPpm).band,
        h.standard,
        h.demo,
        h.provisional,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([head + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "avaran_scans.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onClear = () => {
    clearHistory();
    setHistory([]);
    setDialogOpen(false);
  };

  return (
    <div className="stagger space-y-3.5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Scan records
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCsv}
              disabled={history.length === 0}
              className="relative px-3 after:absolute after:-inset-x-1 after:-inset-y-2 after:content-['']"
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Filter by worker ID"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-3 h-11"
            aria-label="Filter by worker ID"
          />
          {history.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">No records yet.</p>
          ) : filtered.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No records match &quot;{filter}&quot;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">TWA · status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((h) => (
                  <TableRow key={h.id}>
                    {/* Two columns so every row fits a phone: details on the left, the verdict on the right. */}
                    <TableCell className="w-full max-w-0 py-3 whitespace-normal">
                      <span className="block truncate font-medium">{h.worker}</span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        {new Date(h.t).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        <span className="whitespace-nowrap tabular-nums">{h.dose.toFixed(1)} ppm·h</span>
                        {h.demo && " · demo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="block text-[15px] font-semibold tabular-nums">
                        {h.twa.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">ppm</span>
                      </span>
                      <StatusPill band={classify(h.twa, limitPpm).band} className="mt-1 px-2.5 py-0.5 text-[11px]" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={<Button variant="outline" className="mt-3 h-11 w-full" disabled={history.length === 0} />}
            >
              Clear all records
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete all scan records?</DialogTitle>
                <DialogDescription>
                  This deletes all scan records on this device. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button variant="destructive" onClick={onClear}>
                  Delete all
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
