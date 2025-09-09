"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "@/app/component/sidebar/Sidebar";
import Breadcrumb from "@/app/component/common/Breadcrumb";
import { Toaster } from "@/app/component/ui/sheiSonner/sonner";
import { PanelLeft, Sun, Moon } from "lucide-react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { ThemeProvider, useTheme } from "@/lib/context/ThemeContext";
import "antd/dist/reset.css"; // or your antd styles
import "@ant-design/v5-patch-for-react-19"; // patch for React 19
import { useSupabaseAuth } from "@/lib/hooks/userCheckAuth";
import { useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { session, loading } = useSupabaseAuth();
  const router = useRouter();

  // Redirect client-side if no session
  useEffect(() => {
    if (!loading && !session) {
      router.push("/"); // or "/login"
    }
  }, [loading, session, router]);

  if (loading)
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    );

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#3b82f6",
          borderRadius: 8,
        },
      }}
    >
      <div
        className='min-h-screen flex flex-col'
        style={{
          background: theme === "dark" ? "#111827" : "#f9fafb",
          color: theme === "dark" ? "#e5e7eb" : "#111827",
        }}
      >
        {/* Header */}
        <header
          className='flex items-center justify-between p-4 shadow-md'
          style={{
            background: theme === "dark" ? "#1f2937" : "#ffffff",
            color: theme === "dark" ? "#e5e7eb" : "#111827",
          }}
        >
          <div className='flex items-center gap-2'>
            <Image src='/logo.png' alt='Logo' width={40} height={40} />
            <h1 className='text-lg font-bold'>Shei Hoise Dashboard</h1>

            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className='p-2 rounded hover:opacity-70 transition-transform duration-300'
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
            className='p-2 rounded hover:opacity-70'
            style={{ background: theme === "dark" ? "#374151" : "#f3f4f6" }}
          >
            {theme === "light" ? (
              <Moon className='w-5 h-5' />
            ) : (
              <Sun className='w-5 h-5' />
            )}
          </button>
        </header>

        <div className='flex flex-1'>
          <Sidebar collapsed={!isSidebarOpen} themeMode={theme} />
          <main className='flex-1 relative p-4'>
            <Toaster position='top-right' />
            <Breadcrumb />
            <div className='mt-4'>{children}</div>
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
