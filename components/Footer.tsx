"use client";

import { useEffect, useState } from "react";
import { loadCalibration } from "@/lib/calibration";

export function Footer() {
  const [provisional, setProvisional] = useState(false);

  useEffect(() => {
    setProvisional(loadCalibration().provisional);
  }, []);

  return (
    <footer className="py-6 text-center text-[11px] tracking-[0.02em] text-muted-foreground">
      Team AVARAN · SIH26118{provisional ? " · Provisional calibration" : ""}
    </footer>
  );
}
