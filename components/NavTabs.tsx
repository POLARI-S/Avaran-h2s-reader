"use client";

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
  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => (tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href))),
  );
  return (
    // A 40px capsule: 3px inset, 34px segments. Capsule inside capsule keeps the corners concentric.
    <nav
      className="material sticky top-[max(0.5rem,env(safe-area-inset-top))] z-10 grid h-10 grid-cols-4 rounded-full p-[3px]"
      role="tablist"
      aria-label="Sections"
    >
      {/* One selection pill that springs between segments, so it can be retargeted mid-flight. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/4)] rounded-full bg-[linear-gradient(180deg,oklch(1_0_0/0.98),oklch(1_0_0/0.82))] shadow-[inset_0_1px_0_oklch(1_0_0),0_0_0_0.5px_oklch(0.45_0.06_265/0.12),0_1px_2px_oklch(0.25_0.06_265/0.1),0_3px_8px_-2px_oklch(0.25_0.06_265/0.16)] transition-transform duration-[var(--dur-spring)] ease-[var(--ease-bounce)]"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
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
              "relative flex items-center justify-center rounded-full px-1 text-[13px] leading-none font-semibold tracking-[-0.005em] text-foreground/65 transition-colors duration-200 after:absolute after:inset-x-0 after:-inset-y-[5px] after:content-[''] hover:text-foreground",
              active && "text-primary hover:text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
