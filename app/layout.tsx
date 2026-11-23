import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { ChainProvider } from "@/components/chain-provider";
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
  title: "StageChain — Blockchain Ticketing for Entertainment",
  description: "Educational demo of a blockchain app for the entertainment industry: NFT tickets, anti-scalping resale caps, artist royalties and on-chain gate verification.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-100 text-zinc-900">
        <ChainProvider>
          <AppShell>{children}</AppShell>
        </ChainProvider>
      </body>
    </html>
  );
}
