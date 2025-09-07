"use client";

import React from "react";
import { Layout } from "antd";
import SidebarBrand from "./SidebarBrand";
import SidebarMenu from "./SidebarMenu";
import SidebarProfile from "./SidebarProfile";

const { Sider } = Layout;

interface SidebarProps {
  collapsed?: boolean;
  themeMode: "light" | "dark";
}

export default function Sidebar({ collapsed = false, themeMode }: SidebarProps) {
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      className="flex flex-col shadow-md"
      style={{
        background: themeMode === "dark" ? "#111827" : "#ffffff",
        color: themeMode === "dark" ? "#e5e7eb" : "#111827",
      }}
    >
      <div className="flex flex-col flex-1">
        <SidebarBrand collapsed={collapsed} themeMode={themeMode} />
        <SidebarMenu themeMode={themeMode} />
      </div>
      <SidebarProfile collapsed={collapsed} themeMode={themeMode} />
    </Sider>
  );
}
