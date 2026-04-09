"use client";

import { StoreStatus } from "@/lib/types/enums";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dotClass: string }
> = {
  [StoreStatus.PENDING]: {
    label: "Pending",
    className: "text-amber-500  bg-amber-500/10",
    dotClass: "bg-amber-500",
  },
  [StoreStatus.APPROVED]: {
    label: "Approved",
    className: "text-emerald-500 bg-emerald-500/10",
    dotClass: "bg-emerald-500",
  },
  [StoreStatus.REJECTED]: {
    label: "Rejected",
    className: "text-red-500    bg-red-500/10",
    dotClass: "bg-red-500",
  },
  [StoreStatus.TRIAL]: {
    label: "Trial",
    className: "text-cyan-500   bg-cyan-500/10",
    dotClass: "bg-cyan-500",
  },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status?: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg =
    STATUS_CONFIG[status?.toLowerCase() ?? StoreStatus.PENDING] ??
    STATUS_CONFIG[StoreStatus.PENDING];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${cfg.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

// ─── ActiveToggle ─────────────────────────────────────────────────────────────

interface ActiveToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function ActiveToggle({ checked, onChange }: ActiveToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(!checked)}
        title={checked ? "Click to deactivate" : "Click to activate"}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-all duration-300 border ${
          checked
            ? "bg-emerald-500 border-emerald-500"
            : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider ${checked ? "text-emerald-500" : "text-red-500"}`}
      >
        {checked ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-1">
        {icon}
        {label}
      </div>
      <div className="text-slate-800 dark:text-slate-100 text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}
