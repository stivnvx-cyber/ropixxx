import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/Navigation";
import { ProfileDrawer } from "@/components/layout/ProfileDrawer";
import { BottomPlayer } from "@/components/player/BottomPlayer";
import { FullScreenPlayer } from "@/components/player/FullScreenPlayer";
import { Splash } from "@/components/layout/Splash";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Ropixxx — Spotify Mobile",
  description: "Spotify Mobile clone — dark theme, mobile-first, Zustand state, HTML5 audio",
  manifest: "/manifest.json",
  applicationName: "Ropixxx",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ropixxx" },
  icons: { icon: "/favicon.ico", apple: "/icon-192.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-[100dvh] bg-[#121212] text-white antialiased overscroll-y-contain">
        <Splash />
        <ProfileDrawer />
        <div className="mx-auto max-w-[430px] min-h-[100dvh] bg-[#121212] relative flex flex-col">
          <main className="flex-1 pb-[calc(148px+env(safe-area-inset-bottom))]">{children}</main>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto">
            <BottomPlayer />
            <BottomNav />
          </div>
        </div>
        <FullScreenPlayer />
      </body>
    </html>
  );
}
