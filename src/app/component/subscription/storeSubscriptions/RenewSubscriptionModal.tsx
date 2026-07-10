"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { RefreshCw, BadgeCheck, CalendarClock } from "lucide-react";
import {
  StoreSubscription,
  SubscriptionPlan,
  BillingCycle,
  BILLING_CYCLE_LABELS,
} from "@/lib/types/subscription.types";
import { addBillingCycle } from "@/lib/utils/billingCycle";

interface RenewSubscriptionModalProps {
  open: boolean;
  subscription: StoreSubscription | null;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onRenew: (input: {
    plan_id: string;
    billing_cycle: BillingCycle;
    period_start: string;
    period_end: string;
  }) => Promise<void>;
}

const CYCLE_OPTIONS = [
  { value: BillingCycle.MONTHLY, label: "Monthly" },
  { value: BillingCycle.HALF_YEARLY, label: "6 Months" },
  { value: BillingCycle.YEARLY, label: "Yearly" },
];

function calcAmount(plan: SubscriptionPlan, cycle: BillingCycle): number {
  if (cycle === BillingCycle.YEARLY) return plan.price_yearly || plan.price_monthly * 12;
  if (cycle === BillingCycle.HALF_YEARLY) return plan.price_monthly * 6;
  return plan.price_monthly;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function RenewSubscriptionModal({
  open,
  subscription,
  plans,
  onClose,
  onRenew,
}: RenewSubscriptionModalProps) {
  const [planId, setPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [overrideDates, setOverrideDates] = useState(false);
  const [periodStartInput, setPeriodStartInput] = useState("");
  const [periodEndInput, setPeriodEndInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subscription) {
      setPlanId(subscription.plan_id);
      setBillingCycle(subscription.billing_cycle);
    }
    setOverrideDates(false);
    setPeriodStartInput("");
    setPeriodEndInput("");
  }, [subscription, open]);

  if (!subscription) return null;

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const amount = selectedPlan ? calcAmount(selectedPlan, billingCycle) : null;

  const now = new Date();
  const existingEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const isEarlyRenewal = !!existingEnd && existingEnd > now;
  const autoPeriodStart = isEarlyRenewal ? existingEnd! : now;
  const autoPeriodEnd = addBillingCycle(autoPeriodStart, billingCycle);

  const periodStart = overrideDates && periodStartInput ? new Date(periodStartInput) : autoPeriodStart;
  const periodEnd = overrideDates && periodEndInput ? new Date(periodEndInput) : autoPeriodEnd;

  const handleSubmit = async () => {
    if (!planId) return;
    setSaving(true);
    try {
      await onRenew({
        plan_id: planId,
        billing_cycle: billingCycle,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      width={480}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
    >
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 rounded-t-lg px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Renew Subscription</h2>
          <p className="text-violet-200 text-xs mt-0.5">
            {subscription.stores?.store_name ?? "This store"} — generates a new invoice
          </p>
        </div>
      </div>

      <div className="px-6 pt-5 pb-2 flex flex-col gap-5">
        <div>
          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            <BadgeCheck className="w-3 h-3" />
            Plan
          </label>
          <Select
            value={planId || undefined}
            onChange={setPlanId}
            className="w-full"
            size="large"
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} — ৳${p.price_monthly.toLocaleString()}/mo`,
            }))}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block">
            Billing Cycle
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CYCLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBillingCycle(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  billingCycle === opt.value
                    ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25"
                    : "bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-500/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-slate-500">Amount</span>
            <span className="font-extrabold text-violet-700 dark:text-violet-400">
              {amount !== null ? `৳${amount.toLocaleString()}` : "—"} {selectedPlan?.currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">New period</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-right">
              {formatDate(periodStart)} → {formatDate(periodEnd)}
            </span>
          </div>
          {!overrideDates && (
            <p className="text-[11px] text-slate-400 mt-2">
              {isEarlyRenewal
                ? `Renewing early — the new period starts after the current one ends on ${formatDate(existingEnd!)}, so no paid days are lost.`
                : "Starts immediately once this invoice is paid."}
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setOverrideDates(!overrideDates)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            {overrideDates ? "Using custom dates" : "Backdate / set custom period"}
          </button>

          {overrideDates && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Period Start
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                  value={periodStartInput || toDateInput(autoPeriodStart)}
                  onChange={(e) => setPeriodStartInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Period End
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                  value={periodEndInput || toDateInput(autoPeriodEnd)}
                  onChange={(e) => setPeriodEndInput(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          This creates a new unpaid invoice for {BILLING_CYCLE_LABELS[billingCycle].toLowerCase()} billing. The
          subscription itself won&apos;t change until the invoice is marked as paid.
        </p>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2 bg-slate-50 dark:bg-black/[0.12] rounded-b-lg mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.10] transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !planId}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 shadow-md shadow-violet-500/20 transition"
        >
          {saving ? "Generating…" : "Generate Renewal Invoice"}
        </button>
      </div>
    </Modal>
  );
}
