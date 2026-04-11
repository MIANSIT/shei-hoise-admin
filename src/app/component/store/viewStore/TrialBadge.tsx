"use client";

import { StoreStatus } from "@/lib/types/enums";
import { getTrialCountdown } from "@/lib/types/store/trialUtils";

interface TrialBadgeProps {
  status?: string;
  createdAt?: string;
}

export function TrialBadge({ status, createdAt }: TrialBadgeProps) {
  if (status !== StoreStatus.TRIAL) return null;

  const countdown = getTrialCountdown(createdAt);

  if (!countdown) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Trial
      </span>
    );
  }

  if (countdown.phase === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-red-400 bg-red-400/10 border border-red-400/25">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Overdue · {countdown.daysOver}d — review now
      </span>
    );
  }

  const { daysLeft, hoursLeft, pct, phase } = countdown;

  const colorClass =
    phase === "critical"
      ? "text-red-500   bg-red-500/10   border-red-500/25"
      : phase === "warning"
        ? "text-amber-500 bg-amber-500/10 border-amber-500/25"
        : "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";

  const barColor =
    phase === "critical"
      ? "bg-red-500"
      : phase === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  const trackClass = "bg-slate-200 dark:bg-white/[0.08]";

  const label =
    phase === "critical"
      ? hoursLeft > 0
        ? `${hoursLeft}h left`
        : "< 1h left"
      : `${daysLeft}d left`;

  return (
    <div className="flex flex-col gap-1 min-w-[110px]">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap ${colorClass}`}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Trial · {label}
      </span>
      <div className={`h-0.5 rounded-full overflow-hidden ${trackClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
