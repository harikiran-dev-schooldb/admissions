import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/AppToaster";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SchoolDB Admissions", template: "%s | SchoolDB Admissions" },
  description: "School admissions, enquiry and eligibility management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}><body>{children}<AppToaster />{process.env.VERCEL_ENV === "production" && <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />}</body></html>;
}
