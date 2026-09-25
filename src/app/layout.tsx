import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/lib/session";

// UI / body — a characterful grotesk instead of the default Inter look
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

// Display — arty, geometric, festival-poster energy
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Labels, timestamps, slates — film-credit mono
const mono = Space_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Kaledio — Where the industry finds its people",
  description:
    "Kaledio is the professional network for film, TV, OTT, advertising, music video and theatre. Build your reel, find casting calls, hire crews.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${syne.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
