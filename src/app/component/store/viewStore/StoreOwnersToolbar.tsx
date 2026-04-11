"use client";

import { FilterType } from "@/lib/types/store/storeOwner.types";
import { IconSearch, IconFilter } from "./StoreOwnerIcons";

interface StoreOwnersToolbarProps {
  search: string;
  filter: FilterType;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: FilterType) => void;
}

const ACTIVITY_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "inactive", label: "Inactive" },
];

const STATUS_FILTERS: { value: FilterType; label: string; activeClass: string }[] = [
  { value: "trial",    label: "🕐 Trial",    activeClass: "bg-cyan-50   dark:bg-cyan-500/15   text-cyan-600   dark:text-cyan-400"   },
  { value: "pending",  label: "⏳ Pending",  activeClass: "bg-amber-50  dark:bg-amber-500/15  text-amber-600  dark:text-amber-400"  },
  { value: "approved", label: "✅ Approved", activeClass: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { value: "rejected", label: "❌ Rejected", activeClass: "bg-red-50    dark:bg-red-500/15    text-red-600    dark:text-red-400"    },
];

const TAB_INACTIVE = "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300";
const TAB_ACTIVE_DEFAULT = "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400";

export function StoreOwnersToolbar({ search, filter, resultCount, onSearchChange, onFilterChange }: StoreOwnersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3.5 h-11">
          <span className="text-slate-400 dark:text-slate-500 shrink-0"><IconSearch /></span>
          <input
            placeholder="Search by name, email, or store..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-sm shrink-0">
          <IconFilter /><span>{resultCount} results</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Activity group */}
        <div className="flex bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 gap-0.5">
          {ACTIVITY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 border-none cursor-pointer ${
                filter === value ? TAB_ACTIVE_DEFAULT : TAB_INACTIVE
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-slate-200 dark:bg-white/[0.08]" />

        {/* Status group */}
        <div className="flex bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 gap-0.5">
          {STATUS_FILTERS.map(({ value, label, activeClass }) => (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 border-none cursor-pointer ${
                filter === value ? activeClass : TAB_INACTIVE
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}