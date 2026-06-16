import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "InsightX AI — World's Most Advanced AI Video Intelligence Platform",
    template: "%s | InsightX AI",
  },
  description:
    "Transform raw video footage into forensic-grade intelligence in under 90 seconds. 12 AI models working in concert — object detection, person tracking, speech transcription, anomaly detection, and AI-powered investigation reports.",
  keywords: [
    "AI video intelligence", "forensic AI platform", "video evidence analysis",
    "incident detection AI", "security analytics AI", "InsightX AI",
    "video investigation platform", "AI anomaly detection", "evidence intelligence",
  ],
  authors: [{ name: "Ahmad Yasin" }, { name: "Abdul Rehman" }],
  creator: "InsightX AI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://insightx.ai"),
  openGraph: {
    title: "InsightX AI — AI Investigation & Evidence Intelligence Platform",
    description: "Upload any video. Get AI-powered forensic investigation reports in under 90 seconds.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightX AI",
    description: "Upload any video. Get AI-powered investigation reports instantly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)",  color: "#030711" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
