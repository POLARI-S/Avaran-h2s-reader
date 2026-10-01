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
  themeColor: "#1d4ed8",
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
        <div className="mx-auto max-w-[560px] px-4 pt-3 pb-24">
          <header className="flex items-center gap-3 py-1.5 pb-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-[15px] font-extrabold tracking-tight text-primary-foreground">
              H₂S
            </div>
            <div>
              <h1 className="text-lg leading-tight font-bold">H₂S Dose Reader</h1>
              <p className="text-[12.5px] text-muted-foreground">Passive H₂S dosimeter · Team AVARAN</p>
            </div>
          </header>
          <NavTabs />
          <main className="pb-4">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
