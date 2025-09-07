"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "@/app/component/sidebar/Sidebar";
import ProtectedRoute from "@/app/component/common/ProtectedRoute";
import Breadcrumb from "@/app/component/common/Breadcrumb";
import { Toaster } from "@/app/component/ui/sheiSonner/sonner";
import { PanelLeft, Sun, Moon } from "lucide-react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { ThemeProvider, useTheme } from "@/lib/context/ThemeContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ProtectedRoute>
      <ConfigProvider
        theme={{
          algorithm:
            theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#3b82f6",
            borderRadius: 8,
          },
        }}
      >
        <div
          className="min-h-screen flex flex-col"
          style={{
            background: theme === "dark" ? "#111827" : "#f9fafb",
            color: theme === "dark" ? "#e5e7eb" : "#111827",
          }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between p-4 shadow-md"
            style={{
              background: theme === "dark" ? "#1f2937" : "#ffffff",
              color: theme === "dark" ? "#e5e7eb" : "#111827",
            }}
          >
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
              <h1 className="text-lg font-bold">Shei Hoise Dashboard</h1>

              <button
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="p-2 rounded hover:opacity-70 transition-transform duration-300"
                style={{ background: theme === "dark" ? "#374151" : "#f3f4f6" }}
              >
                <PanelLeft
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isSidebarOpen ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded hover:opacity-70"
              style={{ background: theme === "dark" ? "#374151" : "#f3f4f6" }}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </header>

          <div className="flex flex-1">
            <Sidebar collapsed={!isSidebarOpen} themeMode={theme} />
            <main className="flex-1 relative p-4">
              <Toaster position="top-right" />
              <Breadcrumb />
              <div className="mt-4">{children}</div>
            </main>
          </div>
        </div>
      </ConfigProvider>
    </ProtectedRoute>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
