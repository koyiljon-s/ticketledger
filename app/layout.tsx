import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
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
  title: "BC App",
  description: "Blockchain app for entertainment — case study",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${avenir.variable} ${geistMono.variable} h-full antialiased`}>
      <body className={`${avenir.className} flex min-h-full flex-col`}>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
