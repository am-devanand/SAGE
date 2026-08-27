import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAGE — Sustainability Action & Grade Engine",
    short_name: "SAGE",
    description: "Industrial decarbonization scored and actioned. Offline-capable PWA.",
    start_url: "/select-plant",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#faf9f7",
    theme_color: "#ff7a1b",
    orientation: "portrait",
    categories: ["business", "productivity"],
    lang: "en",
    icons: [
      { src: "/sage-mark.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/sage-mark.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
