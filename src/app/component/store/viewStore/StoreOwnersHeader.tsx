"use client";

import { UserWithRelationsType } from "@/lib/schema/user.types";
import { StoreStatus } from "@/lib/types/enums";
import { StoreWithTrial } from "@/lib/types/store/storeOwner.types";
import { getTrialCountdown } from "@/lib/types/store/trialUtils";
import { IconUser } from "./StoreOwnerIcons";

interface StoreOwnersHeaderProps { users: UserWithRelationsType[]; }

export function StoreOwnersHeader({ users }: StoreOwnersHeaderProps) {
  const totalStores   = users.reduce((acc, u) => acc + (u.stores?.length ?? 0), 0);
  const activeStores  = users.reduce((acc, u) => acc + (u.stores?.filter(s => s.is_active).length ?? 0), 0);
  const pendingStores = users.reduce((acc, u) => acc + (u.stores?.filter(s => s.status === StoreStatus.PENDING).length ?? 0), 0);
  const trialCritical = users.reduce((acc, u) => acc + (u.stores?.filter(s => {
    const store = s as StoreWithTrial;
    if (store.status !== StoreStatus.TRIAL) return false;
    const c = getTrialCountdown(store.created_at);
    return c !== null && c.phase === "critical";
  }).length ?? 0), 0);

  const stats = [
    { label: "Total Users",    value: users.length,  color: "text-indigo-500" },
    { label: "Total Stores",   value: totalStores,   color: "text-emerald-500" },
    { label: "Active Stores",  value: activeStores,  color: "text-cyan-500" },
    { label: "Pending Review", value: pendingStores, color: "text-amber-500" },
    { label: "Trial Critical", value: trialCritical, color: "text-red-500" },
  ];

  return (
    <div className="mb-10">
      <div className="flex items-start justify-between flex-wrap gap-4">

        {/* Title */}
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <IconUser />
            </div>
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">
              Super Admin
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Store Owners
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-[15px]">
            Manage and monitor all merchant accounts
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2.5 flex-wrap">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <div className={`text-2xl font-extrabold leading-none ${stat.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}