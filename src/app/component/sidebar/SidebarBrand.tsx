"use client";

import React from "react";

interface SidebarBrandProps {
  collapsed: boolean;
  themeMode?: "light" | "dark"; // optional theme prop
}

export default function SidebarBrand({ collapsed, themeMode = "light" }: SidebarBrandProps) {
  return (
    <div
      className="h-16 flex items-center justify-center font-bold text-lg tracking-wide"
      style={{
        borderBottom: `1px solid ${themeMode === "dark" ? "#374151" : "#e5e7eb"}`,
        color: themeMode === "dark" ? "#e5e7eb" : "#111827",
        background: themeMode === "dark" ? "#111827" : "#ffffff",
      }}
    >
      {collapsed ? "🛒" : "Shei Admin"}
    </div>
  );
}
