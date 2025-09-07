import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅ Patch AntD for React 19 must be first
import "@ant-design/v5-patch-for-react-19";
import "antd/dist/reset.css"; // AntD styles

import { Toaster } from "./component/ui/sheiSonner/sonner";
import { ThemeProvider } from "@/lib/context/ThemeContext"; // ✅ import ThemeProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shei Hoise SuperAdmin",
  description: "Super Admin Panel",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider> {/* ✅ Wrap children with ThemeProvider */}
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
