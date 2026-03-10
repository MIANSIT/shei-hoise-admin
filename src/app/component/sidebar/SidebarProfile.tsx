"use client";

import React, { useState } from "react";
import { Dropdown, MenuProps, Spin } from "antd";
import { User, LogOut, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function SidebarProfile() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const notify = useSheiNotification();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await supabase.auth.signOut();
      notify.success("Logout successful!");
      router.push("/admin-login");
    } catch (err: unknown) {
      console.error("Logout error:", err);
      if (err instanceof Error) {
        notify.error(`Logout failed: ${err.message}`);
      } else {
        notify.error("Logout failed. Please try again.");
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  const userMenu: MenuProps = {
    items: [
      {
        key: "user-info",
        label: (
          <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        ),
        disabled: true,
        className: "!cursor-default hover:!bg-transparent",
      },
      {
        key: "profile",
        icon: <User className="w-4 h-4" />,
        label: <span className="text-sm font-medium">Profile</span>,
        onClick: () => router.push("/dashboard/admin-profile"),
        className: "!py-2",
      },
      {
        key: "store-management",
        icon: <Store className="w-4 h-4" />,
        label: <span className="text-sm font-medium">Store Management</span>,
        onClick: () => router.push("/dashboard/store-management"),
        className: "!py-2",
      },
      { type: "divider" },
      {
        key: "logout",
        icon: <LogOut className="w-4 h-4" />,
        label: <span className="text-sm font-medium">Logout</span>,
        danger: true,
        onClick: handleLogout,
        className: "!py-2",
      },
    ],
  };

  return (
    <Dropdown
      menu={userMenu}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{
        minWidth: "240px",
        boxShadow:
          "0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        borderRadius: "12px",
      }}
    >
      <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-medium">
          {user?.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
        </div>
        {logoutLoading && <Spin size="small" />}
      </button>
    </Dropdown>
  );
}
