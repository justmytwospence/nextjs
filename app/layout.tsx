import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Topbar from "@/components/topbar"; // Adjust the import path as needed

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Strava Tools",
  description: "The things you wished Strava could do",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <div className="border-b">
          <div className="max-w-7xl mx-auto">
            <Topbar />
          </div>
        </div>
        <main className="relative">
          <div className="max-w-7xl mx-auto px-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
