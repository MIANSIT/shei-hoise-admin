"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/app/component/sidebar/Sidebar";
import SidebarProfile from "@/app/component/sidebar/SidebarProfile";
import Breadcrumb from "@/app/component/common/Breadcrumb";
import { Toaster } from "@/app/component/ui/sheiSonner/sonner";
import { Moon, PanelLeft, Sun, ArrowUp } from "lucide-react";
import {
  ConfigProvider,
  theme as antdTheme,
  App as AntdApp,
  Spin,
  Drawer,
} from "antd";
import { useSupabaseAuth } from "../../lib/hooks/userCheckAuth";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { USER_TYPES } from "@/lib/types/enums";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { session, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const { role, loading: userLoading } = useCurrentUser();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if no session or wrong role
  useEffect(() => {
    if (authLoading || userLoading) return;

    if (!session) {
      router.replace("/admin-login");
      return;
    }

    if (
      role !== undefined &&
      role !== USER_TYPES.SUPER_ADMIN &&
      role !== USER_TYPES.ADMIN
    ) {
      router.push("/");
    }
  }, [authLoading, userLoading, session, router, role]);

  // Check if mobile and handle sidebar
  useEffect(() => {
    if (!mounted) return;

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mounted]);

  // Load saved theme
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, [mounted]);

  // Handle scroll to show/hide back to top button
  useEffect(() => {
    if (!mounted) return;

    let scrollElement: HTMLElement | null = null;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop =
        target.scrollTop ||
        window.scrollY ||
        document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 200);
    };

    const mainContent = mainContentRef.current;
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
      scrollElement = mainContent;
    }

    if (!scrollElement && mainContent) {
      let parent = mainContent.parentElement;
      let level = 0;
      while (parent && level < 5) {
        if (parent.scrollHeight > parent.clientHeight) {
          scrollElement = parent;
          break;
        }
        parent = parent.parentElement;
        level++;
      }
    }

    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleScroll({ target: scrollElement } as any);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [mounted]);

  const scrollToTop = () => {
    if (mainContentRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = mainContentRef.current;
      if (scrollHeight > clientHeight && scrollTop > 0) {
        mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <Spin size="large" />
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

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
        components: {
          Menu: {
            itemColor: theme === "dark" ? "#d1d5db" : "#374151",
            itemHoverBg: theme === "dark" ? "#1f2937" : "#000000",
            itemHoverColor: theme === "dark" ? "#e5e7eb" : "#e5e7eb",
            itemSelectedBg: theme === "dark" ? "#374151" : "#000000",
            itemSelectedColor: "#ffffff",
            groupTitleColor: theme === "dark" ? "#d1d5db" : "#374151",
          },
          Drawer: {
            colorBgElevated: "var(--sidebar)",
          },
        },
      }}
    >
      <AntdApp
        message={{
          top: 24,
          duration: 2,
          maxCount: 3,
          rtl: false,
          prefixCls: "ant-message",
          getContainer: () => document.body,
        }}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header
            className="flex items-center justify-between p-1 shadow-md sticky top-0 z-50"
            style={{
              background: "var(--card)",
              color: "var(--card-foreground)",
            }}
          >
            <div className="flex items-center gap-2 px-2">
              <h1 className="text-lg font-bold">Dashboard</h1>
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded hover:opacity-70 transition-transform duration-300"
                style={{ background: "var(--muted)" }}
              >
                <PanelLeft
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isMobile || !isSidebarOpen ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const newTheme = theme === "light" ? "dark" : "light";
                  setTheme(newTheme);
                  localStorage.setItem("theme", newTheme);
                  document.documentElement.classList.toggle(
                    "dark",
                    newTheme === "dark",
                  );
                }}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              <SidebarProfile />
            </div>
          </header>

          <div className="flex flex-1">
            {!isMobile && (
              <div
                className={`sticky top-0 h-screen shadow-md transition-all duration-300 ${isSidebarOpen}`}
                style={{ background: "var(--sidebar)" }}
              >
                <Sidebar collapsed={!isSidebarOpen} themeMode={theme} />
              </div>
            )}

            <Drawer
              title="Menu"
              placement="bottom"
              open={mobileDrawerOpen}
              onClose={() => setMobileDrawerOpen(false)}
              size="large"
              closable={true}
              styles={{
                body: { padding: 0 },
                header: {
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                },
              }}
            >
              <div className="h-full">
                <Sidebar
                  collapsed={false}
                  themeMode={theme}
                  isMobile={true}
                  onMobileMenuClick={() => setMobileDrawerOpen(false)}
                />
              </div>
            </Drawer>

            <main
              className="flex-1 flex flex-col overflow-auto min-h-[calc(100vh-73px)] relative"
              style={{
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            >
              <Toaster position="top-right" />

              <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <Breadcrumb />
              </div>

              <div
                className="flex-1 overflow-auto p-3 bg-gray-50 dark:bg-gray-950"
                ref={mainContentRef}
              >
                {children}
              </div>
            </main>
          </div>

          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-4 right-2 p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-110"
              style={{ background: "#3b82f6", color: "#ffffff", zIndex: 9999 }}
              aria-label="Back to top"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          )}
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
