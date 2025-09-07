"use client";

import React, { useState } from "react";
import { Avatar, Dropdown, Tooltip, Spin } from "antd";
import { LogOut } from "lucide-react";
import { LucideIcon } from "@/lib/LucideIcon";
import { useAuthStore } from "@/lib/store/authStore";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SidebarProfileProps {
  collapsed: boolean;
  themeMode: "light" | "dark";
}

export default function SidebarProfile({
  collapsed,
  themeMode,
}: SidebarProfileProps) {
  const logout = useAuthStore((state) => state.logout);
  const { success, error } = useSheiNotification();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      // Call Supabase signOut
      await supabase.auth.signOut();
      // Show success notification
      success("Logout successful!");

      // Redirect to homepage
      router.push("/");
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      error(`Logout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const profileMenu = {
    items: [
      {
        key: "logout",
        label: "Logout",
        danger: true,
        icon: <LucideIcon icon={LogOut} size={16} />,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <div
      className='p-4 mt-auto'
      style={{
        borderTop: `1px solid ${themeMode === "dark" ? "#374151" : "#e5e7eb"}`,
        background: themeMode === "dark" ? "#111827" : "#ffffff",
        color: themeMode === "dark" ? "#e5e7eb" : "#111827",
      }}
    >
      {collapsed ? (
        <Dropdown menu={profileMenu} placement='topRight'>
          <Avatar
            size={40}
            style={{
              backgroundColor: themeMode === "dark" ? "#3b82f6" : "#2563eb",
            }}
          >
            AD
          </Avatar>
        </Dropdown>
      ) : (
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <Avatar
              size={40}
              style={{
                backgroundColor: themeMode === "dark" ? "#3b82f6" : "#2563eb",
              }}
            >
              AD
            </Avatar>
            <div>
              <div className='text-sm font-medium'>Admin</div>
              <div className='text-xs opacity-70'>admin@sheihoise.com</div>
            </div>
          </div>
          <Tooltip title='Logout'>
            <button
              onClick={handleLogout}
              className='transition hover:cursor-pointer'
              disabled={loading}
            >
              {loading ? (
                <Spin size='small' />
              ) : (
                <LucideIcon icon={LogOut} size={20} />
              )}
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
