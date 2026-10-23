"use client";

import React, { useState } from "react";
import { Dropdown, MenuProps, Spin } from "antd";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCurrentUser, clearUserCache } from "@/lib/hooks/useCurrentUser";

export default function SidebarProfile() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      // "local" clears this browser's session without waiting on a global
      // revoke; a failure there must not leave the user stuck logged in.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) console.error("Logout error:", error);
    } catch (err: unknown) {
      console.error("Logout error:", err);
    } finally {
      clearUserCache();
      // Hard navigation drops the Next.js router cache and any in-memory
      // state, so the middleware sees the cleared cookies on the next request.
      window.location.replace("/");
    }
  };

  const userMenu: MenuProps = {
    items: [
      {
        key: "user-info",
        label: (
          <div className="px-2 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
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
      <button className="flex items-center gap-2 p-2 rounded-full hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-medium">
          {user?.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
        </div>
        {logoutLoading && <Spin size="small" />}
      </button>
    </Dropdown>
  );
}
