"use client";

import { useState } from "react";
import {
  STORE_STATUS,
  STORE_STATUS_LABELS,
  StoreStatus,
} from "@/lib/types/enums";
import { StoreWithTrial } from "@/lib/types/store/storeOwner.types";
import { TrialBadge } from "./TrialBadge";
import { StatusBadge, ActiveToggle, StatCard } from "./StoreOwnerBadges";
import {
  IconStore,
  IconChevron,
  IconDollar,
  IconTruck,
  IconTrash,
} from "./StoreOwnerIcons";

function formatCurrency(amount?: number | string, currency = "BDT") {
  if (amount === undefined || amount === null || amount === "") return "—";
  return `${Number(amount).toLocaleString()} ${currency}`;
}

interface StoreCardProps {
  store: StoreWithTrial;
  onStatusChange: (storeId: string, status: StoreStatus) => void;
  onActiveChange: (storeId: string, isActive: boolean) => void;
  onDelete: (store: StoreWithTrial) => void;
}

export function StoreCard({
  store,
  onStatusChange,
  onActiveChange,
  onDelete,
}: StoreCardProps) {
  const [open, setOpen] = useState(false);
  const settings = store.store_settings?.[0];

  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-white/[0.15]">
      {/* Store header row */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 dark:bg-white/[0.08] border border-slate-300 dark:border-white/[0.1] text-slate-400 dark:text-slate-500">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof store.logo_url === "string" ? store.logo_url : undefined
              }
              alt="logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <IconStore />
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] text-slate-900 dark:text-slate-100 tracking-tight">
              {store.store_name}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/[0.06] px-2 py-0.5 rounded font-mono">
              /{store.store_slug}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <StatusBadge status={store.status} />
            <TrialBadge status={store.status} createdAt={store.created_at} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <ActiveToggle
            checked={store.is_active ?? false}
            onChange={(v) => onActiveChange(store.id, v)}
          />
          <select
            value={store.status ?? STORE_STATUS.PENDING}
            onChange={(e) =>
              onStatusChange(store.id, e.target.value as StoreStatus)
            }
            className="bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] rounded-lg text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1.5 cursor-pointer outline-none"
          >
            {Object.entries(STORE_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setOpen(!open)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            <IconChevron open={open} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(store);
            }}
            title="Delete store"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 transition-colors"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Expanded settings */}
      {open && settings && (
        <div
          className="border-t border-slate-200 dark:border-white/[0.06] px-5 py-5 grid gap-3 bg-white dark:bg-black/[0.15]"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            animation: "slideDown 0.2s ease",
          }}
        >
          <StatCard
            icon={<IconDollar />}
            label="Currency"
            value={settings.currency ?? "—"}
          />
          <StatCard
            icon={<IconDollar />}
            label="Tax Rate"
            value={
              settings.tax_rate !== undefined ? `${settings.tax_rate}%` : "—"
            }
          />
          <StatCard
            icon={<IconDollar />}
            label="Min Order"
            value={formatCurrency(settings.min_order_amount, settings.currency)}
          />
          <StatCard
            icon={<IconDollar />}
            label="Free Shipping At"
            value={formatCurrency(
              settings.free_shipping_threshold,
              settings.currency,
            )}
          />
          <StatCard
            icon={<IconTruck />}
            label="Processing"
            value={
              settings.processing_time_days !== undefined
                ? `${settings.processing_time_days} days`
                : "—"
            }
          />
          <StatCard
            icon={<IconTruck />}
            label="Return Window"
            value={
              settings.return_policy_days !== undefined
                ? `${settings.return_policy_days} days`
                : "—"
            }
          />

          {Array.isArray(settings.shipping_fees) &&
            settings.shipping_fees.length > 0 && (
              <div className="col-span-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-2">
                  Shipping Methods
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    settings.shipping_fees as Array<{
                      name: string;
                      price: number;
                      estimated_days?: string;
                    }>
                  ).map((fee, i) => (
                    <div
                      key={i}
                      className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {fee.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                        {fee.price} {settings.currency}
                      </span>
                      {fee.estimated_days && (
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5 text-[11px]">
                          · {fee.estimated_days}d
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
