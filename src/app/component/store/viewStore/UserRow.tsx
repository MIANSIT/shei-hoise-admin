"use client";

import { useState } from "react";
import { StoreStatus } from "@/lib/types/enums";
import { UserWithRelationsType } from "@/lib/schema/user.types";
import { StoreWithTrial } from "@/lib/types/store/storeOwner.types";
import { StoreCard } from "./StoreCard";
import { IconStore, IconGlobe, IconMail, IconPhone, IconChevron } from "./StoreOwnerIcons";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-sky-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
  "from-purple-400 to-pink-400",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface UserRowProps {
  user: UserWithRelationsType;
  index: number;
  onStatusChange: (storeId: string, status: StoreStatus) => void;
  onActiveChange: (storeId: string, isActive: boolean) => void;
  onDeleteStore: (store: StoreWithTrial) => void;
}

export function UserRow({ user, index, onStatusChange, onActiveChange, onDeleteStore }: UserRowProps) {
  const [expanded, setExpanded] = useState(false);
  const profile    = user.user_profiles?.[0];
  const fullName   = `${user.first_name} ${user.last_name}`;
  const storeCount = user.stores?.length ?? 0;
  const gradient   = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <div className={`bg-white dark:bg-white/[0.025] border rounded-2xl overflow-hidden transition-all duration-200 ${
      expanded
        ? "border-slate-300 dark:border-white/[0.14] shadow-lg dark:shadow-black/40"
        : "border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14]"
    }`}>

      {/* Collapsed row */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-2xl shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[15px] font-bold tracking-wide shadow-md`}>
          {profile?.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
            : getInitials(fullName)}
        </div>

        {/* Name + email */}
        <div className="flex-[0_0_220px] min-w-0">
          <div className="font-bold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {fullName}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs mt-0.5">
            <IconMail />{user.email}
          </div>
        </div>

        {/* Phone */}
        <div className="flex-[0_0_150px] flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
          <IconPhone />{user.phone}
        </div>

        {/* Country */}
        <div className="flex-[0_0_120px] flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
          <IconGlobe />{profile?.country ?? "—"}
        </div>

        {/* User active status */}
        <div className="flex-[0_0_90px]">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
            user.is_active
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
              : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Store count */}
        <div className="flex-1 flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-sm">
          <IconStore />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{storeCount}</span>
          <span>{storeCount === 1 ? "store" : "stores"}</span>
        </div>

        {/* Chevron */}
        <div className="text-slate-400 dark:text-slate-500">
          <IconChevron open={expanded} />
        </div>
      </div>

      {/* Expanded stores */}
      {expanded && (
        <div
          className="border-t border-slate-100 dark:border-white/[0.06] px-6 py-5 flex flex-col gap-3 bg-slate-50 dark:bg-black/[0.1]"
          style={{ animation: "slideDown 0.25s ease" }}
        >
          {storeCount === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm bg-white dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              No stores found
            </div>
          ) : (
            (user.stores as StoreWithTrial[])?.map(store => (
              <StoreCard key={store.id} store={store} onStatusChange={onStatusChange} onActiveChange={onActiveChange} onDelete={onDeleteStore} />
            ))
          )}
        </div>
      )}
    </div>
  );
}