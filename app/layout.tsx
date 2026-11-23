import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/AppToaster";
import { AccessProvider } from "@/components/auth/AccessProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Prevent OS dark-mode preferences from changing native controls or the PWA shell.
export const viewport: Viewport = { colorScheme: "light" };

export const metadata: Metadata = {
  title: { default: "SchoolDB Admissions", template: "%s | SchoolDB Admissions" },
  description: "School admissions, enquiry and eligibility management.",
  applicationName: "SchoolDB Admissions",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SchoolDB", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}><body><AccessProvider>{children}<AppToaster /></AccessProvider>{process.env.VERCEL_ENV === "production" && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}</body></html>;
}
