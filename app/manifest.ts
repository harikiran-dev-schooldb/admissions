import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SchoolDB Admissions",
    short_name: "SchoolDB",
    description: "School admissions, enquiries, fees and academic-year management.",
    id: "/admissions",
    start_url: "/admissions",
    scope: "/",
    display: "standalone",
    background_color: "#f8faff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
