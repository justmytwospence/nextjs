import Topbar from "@/components/topbar";
import type { Metadata } from "next";
import localFont from "next/font/local";
import ReactProviders from "./providers";
import "./globals.css";
import { auth } from "@/auth";

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
  const session = auth();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <ReactProviders session={session}>
          <div className="border-b">
            <div className="max-w-7xl mx-auto px-6">
              <Topbar />
            </div>
          </div>
          <main className="relative">
            <div className="max-w-7xl mx-auto px-6">{children}</div>
          </main>
        </ReactProviders>
      </body>
    </html>
  );
}
