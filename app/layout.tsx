import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AppShell } from "@/components/app-shell";
import { ChainProvider } from "@/components/chain-provider";
import "./globals.css";

// Avenir ships as Light/Book/Heavy/Black only (no Medium/Roman). Heavy is registered
// as 700 so Tailwind's font-semibold/font-bold resolve to it and font-extrabold to Black.
const avenir = localFont({
  variable: "--font-avenir",
  display: "swap",
  src: [
    { path: "./fonts/avenir-font-family/Avenir-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/avenir-font-family/Avenir-LightOblique.ttf", weight: "300", style: "italic" },
    { path: "./fonts/avenir-font-family/Avenir-Book.ttf", weight: "400", style: "normal" },
    { path: "./fonts/avenir-font-family/Avenir-BookOblique.ttf", weight: "400", style: "italic" },
    { path: "./fonts/avenir-font-family/Avenir-Heavy.ttf", weight: "700", style: "normal" },
    { path: "./fonts/avenir-font-family/Avenir-HeavyOblique.ttf", weight: "700", style: "italic" },
    { path: "./fonts/avenir-font-family/Avenir-Black.ttf", weight: "900", style: "normal" },
    { path: "./fonts/avenir-font-family/Avenir-BlackOblique.ttf", weight: "900", style: "italic" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StageChain — Blockchain Ticketing for Entertainment",
  description: "Educational demo of a blockchain app for the entertainment industry: NFT tickets, anti-scalping resale caps, artist royalties and on-chain gate verification.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${avenir.variable} ${geistMono.variable} h-full antialiased`}>
      <body className={`${avenir.className} min-h-full bg-zinc-100 text-zinc-900`}>
        <ChainProvider>
          <AppShell>{children}</AppShell>
        </ChainProvider>
      </body>
    </html>
  );
}
