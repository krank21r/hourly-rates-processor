import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work Processor - Hourly Rates & Data Management",
  description: "Comprehensive platform for processing work data, managing hourly rates, and handling various work-related tasks with efficiency and accuracy.",
  keywords: ["Work Processor", "Hourly Rates", "Data Management", "CSV Processing", "RSP Works", "IRSP Works"],
  authors: [{ name: "Work Processor Team" }],
  openGraph: {
    title: "Work Processor",
    description: "Comprehensive platform for work data processing and management",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
