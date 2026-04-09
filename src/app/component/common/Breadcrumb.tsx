"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Breadcrumb() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  if (!isDashboard) return null;

  const shouldCollapse = segments.length > 2;
  const handleToggle = () => setIsExpanded(!isExpanded);

  const separatorStyle = { color: "var(--muted-foreground)" };
  const activeStyle = { color: "var(--foreground)", fontWeight: 600 };
  const inactiveStyle = { color: "var(--muted-foreground)" };
  const linkStyle = { color: "var(--foreground)", fontWeight: 600 };

  const BreadcrumbItem = ({
    segment,
    index,
    onClickExtra,
  }: {
    segment: string;
    index: number;
    onClickExtra?: () => void;
  }) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment.replace(/-/g, " ");
    const formatted = label.charAt(0).toUpperCase() + label.slice(1);
    const isLast = index === segments.length - 1;

    return (
      <li className="flex items-center">
        <span className="mx-1 md:mx-2 text-xs" style={separatorStyle}>
          /
        </span>
        {isLast ? (
          <span style={inactiveStyle}>{formatted}</span>
        ) : (
          <Link
            href={href}
            style={linkStyle}
            className="hover:opacity-70 transition-opacity"
            onClick={onClickExtra}
          >
            {formatted}
          </Link>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Breadcrumb" className="px-4 py-2">
      {/* Mobile */}
      <div className="block md:hidden">
        {shouldCollapse && !isExpanded ? (
          <div className="flex items-center text-sm">
            <button
              onClick={handleToggle}
              className="flex items-center hover:opacity-70 transition-opacity"
              aria-label="Show full breadcrumb"
            >
              <span style={separatorStyle}>⋯</span>
              <span className="mx-2" style={separatorStyle}>
                /
              </span>
            </button>
            <span style={inactiveStyle}>
              {segments[segments.length - 1]
                .replace(/-/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase())}
            </span>
          </div>
        ) : (
          <ol className="flex items-center flex-wrap gap-y-1 text-sm">
            <li>
              <Link
                href="/dashboard"
                style={linkStyle}
                className="hover:opacity-70 transition-opacity"
              >
                Dashboard
              </Link>
            </li>
            {segments.map((segment, index) => {
              if (index === 0) return null;
              return (
                <BreadcrumbItem
                  key={index}
                  segment={segment}
                  index={index}
                  onClickExtra={() => setIsExpanded(false)}
                />
              );
            })}
            {shouldCollapse && (
              <button
                onClick={handleToggle}
                className="ml-2 text-xs hover:opacity-70"
                style={{ color: "#3b82f6" }}
              >
                ▲
              </button>
            )}
          </ol>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <ol className="flex items-center space-x-1 text-sm">
          <li>
            <Link
              href="/dashboard"
              style={linkStyle}
              className="hover:opacity-70 transition-opacity"
            >
              Dashboard
            </Link>
          </li>
          {segments.map((segment, index) => {
            if (index === 0) return null;
            return (
              <BreadcrumbItem key={index} segment={segment} index={index} />
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
