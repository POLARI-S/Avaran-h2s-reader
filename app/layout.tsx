import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { NavTabs } from "@/components/NavTabs";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "H₂S Dose Reader · Team AVARAN",
  description: "Passive wristband H₂S dose reader — scans a patch photo into a shift dose and TWA.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Light, glass-tinted chrome so the browser bar blends into the page.
  themeColor: "#e9eefb",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerRegister />
        <div className="mx-auto max-w-[560px] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))]">
          <header className="flex items-center gap-3 py-2 pb-3.5">
            <div className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-gradient-to-b from-[oklch(0.55_0.19_265)] to-primary text-[15px] font-extrabold tracking-tight text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.28),0_4px_12px_-4px_oklch(0.45_0.18_265/0.55)]">
              H₂S
            </div>
            <div>
              <h1 className="text-[19px] leading-tight font-bold tracking-[-0.022em]">H₂S Dose Reader</h1>
              <p className="text-[12.5px] leading-snug text-muted-foreground">Passive H₂S dosimeter · Team AVARAN</p>
            </div>
          </header>
          <NavTabs />
          <main className="pt-4 pb-4">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
