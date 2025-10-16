import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import "@/lib/db.js";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Zibtek — Home",
  description: "Zibtek project landing page with AI chatbot integration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100`}
      >
        {/* Navbar at top */}
        <Navbar />

        {/* Main page content */}
        <main suppressHydrationWarning className="max-w-6xl mx-auto px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
