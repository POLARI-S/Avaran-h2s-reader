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
  return (
    <nav
      className="sticky top-0 z-10 grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
      role="tablist"
      aria-label="Sections"
    >
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "min-h-11 rounded-lg px-1 py-2.5 text-center text-[13px] font-semibold text-muted-foreground transition-colors",
              active && "bg-background text-primary shadow-sm",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
