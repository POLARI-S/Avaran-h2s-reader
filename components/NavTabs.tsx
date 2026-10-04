"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/scan/", label: "Scan" },
  { href: "/records/", label: "Records" },
  { href: "/setup/", label: "Setup" },
];

export function NavTabs() {
  const pathname = usePathname();
  const lensRef = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const [pressed, setPressed] = useState(false);
  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => (tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href))),
  );

  // Liquid travel: stretch the lens while it moves (more for longer jumps),
  // then release so the bouncy spring wobbles it back to round.
  const prevIndex = useRef(activeIndex);
  useEffect(() => {
    const lens = lensRef.current;
    const delta = activeIndex - prevIndex.current;
    const distance = Math.abs(delta);
    prevIndex.current = activeIndex;
    if (!lens || distance === 0) return;
    lens.dataset.dir = delta > 0 ? "right" : "left";
    lens.style.setProperty("--sx", String(1 + 0.08 * Math.min(distance, 3) + 0.04));
    lens.classList.add("is-moving");
    const settle = window.setTimeout(() => lens.classList.remove("is-moving"), 200);
    return () => window.clearTimeout(settle);
  }, [activeIndex]);

  // The lens's highlights follow the pointer, as if it were the light source.
  const moveLight = (e: React.PointerEvent) => {
    const x = e.clientX;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const lens = lensRef.current;
      if (!lens) return;
      const r = lens.getBoundingClientRect();
      const pct = Math.min(90, Math.max(10, ((x - r.left) / r.width) * 100));
      lens.style.setProperty("--lx", `${pct.toFixed(1)}%`);
      // Rim light swings from the left edge (110deg) through the top (180deg) to the right (250deg).
      lens.style.setProperty("--la", `${(110 + pct * 1.4).toFixed(0)}deg`);
    });
  };
  const resetLight = () => {
    cancelAnimationFrame(frame.current);
    lensRef.current?.style.removeProperty("--lx");
    lensRef.current?.style.removeProperty("--la");
    setPressed(false);
  };

  return (
    // A 41px capsule with an even 4px inset all round and 33px segments.
    // An equal inset is what keeps the inner and outer curves concentric.
    <nav
      className="material sticky top-[max(0.5rem,env(safe-area-inset-top))] z-10 grid h-[41px] grid-cols-4 rounded-full p-1"
      role="tablist"
      aria-label="Sections"
      onPointerMove={moveLight}
      onPointerLeave={resetLight}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      {/* One glass lens that springs between segments, so it can be retargeted mid-flight.
          Pressing swells it slightly, like liquid, before it glides to the new tab.
          The frame around it is cut to the bar's exact shape, so no stretch, swell or
          spring can ever draw outside the bar. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span
          ref={lensRef}
          data-pressed={pressed}
          className="liquid-lens absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/4)] rounded-full"
          style={{ translate: `${activeIndex * 100}% 0` }}
        />
      </span>
      {TABS.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              // Flex-centred so the label sits on the optical middle; the ::after extends the hit area to 44px.
              "relative flex items-center justify-center rounded-full px-1 text-[13.5px] leading-none font-medium tracking-[-0.005em] text-foreground/60 transition-colors duration-200 after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-[''] hover:text-foreground",
              active && "font-semibold text-primary hover:text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
