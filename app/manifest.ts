import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H₂S Dose Reader · Team AVARAN",
    short_name: "H₂S Reader",
    description: "Passive wristband H₂S dose reader — scans a patch photo into a shift dose and TWA.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f9",
    theme_color: "#e9eefb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
