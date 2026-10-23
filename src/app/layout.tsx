import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import Script from "next/script";
import { LocaleProvider } from "@/lib/i18n/locale";
import { themeScript } from "@/lib/theme";
import "./globals.css";

// Overpass is an open-source face based on U.S. highway-sign lettering.
const overpass = Overpass({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"], variable: "--font-overpass" });

export const metadata: Metadata = {
  title: "WhoseJob? — find the office that fixes it",
  description: "Find the one office that fixes a problem at your exact spot in Virginia's 8th District, and get a report ready to send.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme before React loads, so the server's HTML differs on purpose.
    <html lang="en" className={overpass.variable} suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
