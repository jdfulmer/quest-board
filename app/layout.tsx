import type { Metadata, Viewport } from "next";
import { MedievalSharp, Crimson_Text } from "next/font/google";
import "./globals.css";

const medievalSharp = MedievalSharp({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-medieval-sharp",
});

const crimsonText = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson-text",
});

export const metadata: Metadata = {
  title: "Quest Board - D&D Session Scheduler",
  description:
    "Rally your party and schedule your next adventure. A D&D-themed scheduling tool for tabletop groups.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quest Board",
  },
};

export const viewport: Viewport = {
  themeColor: "#3d2b1f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${medievalSharp.variable} ${crimsonText.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
