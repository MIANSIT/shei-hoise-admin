"use client";

import React from "react";
import { Layout } from "antd";
import SidebarMenu from "./SidebarMenu";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  themeMode: "light" | "dark";
  isMobile?: boolean;
  onMobileMenuClick?: () => void; // Add this prop
}

export default function Sidebar({
  collapsed = false,
  themeMode,
  isMobile = false,
  onMobileMenuClick,
}: SidebarProps) {
  const { storeSlug } = useCurrentUser();
  // const router = useRouter();

  // const storeMenu = {
  //   items: [
  //     {
  //       key: "go",
  //       icon: <Home className="w-5 h-5" />,
  //       label: "Go to Store",
  //       onClick: () => {
  //         router.push(`/${storeSlug}`);
  //         onMobileMenuClick?.(); // Close drawer on mobile
  //       },
  //     },
  //     {
  //       key: "copy",
  //       icon: <Copy className="w-5 h-5" />,
  //       label: "Copy Store Link",
  //       onClick: () => {
  //         const storeUrl = `${window.location.origin}/${storeSlug}`;
  //         navigator.clipboard
  //           .writeText(storeUrl)
  //           .then(() => {
  //             toast.success("Store link copied!");
  //             onMobileMenuClick?.(); // Close drawer on mobile
  //           })
  //           .catch(() => toast.error("Failed to copy link"));
  //       },
  //     },
  //   ],
  // };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      className="flex flex-col"
      style={{
        background: "var(--sidebar)",
      }}
    >
      <div className="flex flex-col flex-1">
        {/* Middle: Menu */}
        <SidebarMenu
          themeMode={themeMode}
          storeSlug={storeSlug}
          isMobile={isMobile}
          onMobileMenuClick={onMobileMenuClick} // Pass to SidebarMenu
        />

        {/* Bottom: Store Dropdown */}
      </div>
    </Sider>
  );
}
