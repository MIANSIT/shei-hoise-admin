"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { ChevronDown, ChevronUp, Store, Zap, Calendar, BadgeCheck } from "lucide-react";
import {
  StoreSubscription,
  SubscriptionPlan,
  SimpleStore,
  SubscriptionStatus,
  BillingCycle,
  SUBSCRIPTION_STATUS_LABELS,
  BILLING_CYCLE_LABELS,
  CreateStoreSubscriptionInput,
  UpdateStoreSubscriptionInput,
} from "@/lib/types/subscription.types";

interface SubscriptionFormModalProps {
  open: boolean;
  subscription?: StoreSubscription | null;
  plans: SubscriptionPlan[];
  stores: SimpleStore[];
  onClose: () => void;
  onCreate: (input: CreateStoreSubscriptionInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateStoreSubscriptionInput) => Promise<void>;
}

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const fromDateInput = (val: string) => (val ? new Date(val).toISOString() : null);

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

export function SubscriptionFormModal({
  open,
  subscription,
  plans,
  stores,
  onClose,
  onCreate,
  onUpdate,
}: SubscriptionFormModalProps) {
  const isEdit = !!subscription;
  const [saving, setSaving] = useState(false);

  const [storeId, setStoreId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.INCOMPLETE);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [startedAt, setStartedAt] = useState(toDateInput(new Date().toISOString()));
  const [expiresAt, setExpiresAt] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [periodStart, setPeriodStart] = useState(toDateInput(new Date().toISOString()));
  const [periodEnd, setPeriodEnd] = useState("");
  const [cancelsAtPeriodEnd, setCancelsAtPeriodEnd] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === planId) ?? null;
  const planAmount = selectedPlan ? calcAmount(selectedPlan, billingCycle) : null;

  useEffect(() => {
    setValidationError(null);
    setShowAdvanced(false);
    if (subscription) {
      setPlanId(subscription.plan_id);
      setStatus(subscription.status);
      setBillingCycle(subscription.billing_cycle);
      setStartedAt(toDateInput(subscription.started_at));
      setExpiresAt(toDateInput(subscription.expires_at));
      setTrialEndsAt(toDateInput(subscription.trial_ends_at));
      setPeriodStart(toDateInput(subscription.current_period_start));
      setPeriodEnd(toDateInput(subscription.current_period_end));
      setCancelsAtPeriodEnd(subscription.cancels_at_period_end);
      setPaymentProvider(subscription.payment_provider ?? "");
    } else {
      setStoreId("");
      setPlanId("");
      setStatus(SubscriptionStatus.INCOMPLETE);
      setBillingCycle(BillingCycle.MONTHLY);
      setStartedAt(toDateInput(new Date().toISOString()));
      setExpiresAt("");
      setTrialEndsAt("");
      setPeriodStart(toDateInput(new Date().toISOString()));
      setPeriodEnd("");
      setCancelsAtPeriodEnd(false);
      setPaymentProvider("");
    }
  }, [subscription, open]);

  const handleSubmit = async () => {
    setValidationError(null);
    if (!isEdit && !storeId) { setValidationError("Please select a store."); return; }
    if (!planId) { setValidationError("Please select a plan."); return; }
    setSaving(true);
    try {
      if (isEdit && subscription) {
        await onUpdate(subscription.id, {
          plan_id: planId,
          status,
          billing_cycle: billingCycle,
          started_at: fromDateInput(startedAt) ?? undefined,
          expires_at: fromDateInput(expiresAt),
          trial_ends_at: fromDateInput(trialEndsAt),
          current_period_start: fromDateInput(periodStart) ?? undefined,
          current_period_end: fromDateInput(periodEnd),
          cancels_at_period_end: cancelsAtPeriodEnd,
          payment_provider: paymentProvider || null,
        });
      } else {
        const selectedStore = stores.find((s) => s.id === storeId);
        if (!selectedStore) { setValidationError("Selected store not found."); return; }
        if (!selectedStore.owner_id) { setValidationError("This store has no owner assigned."); return; }
        await onCreate({
          store_id: storeId,
          user_id: selectedStore.owner_id,
          plan_id: planId,
          status,
          billing_cycle: billingCycle,
          started_at: fromDateInput(startedAt) ?? undefined,
          expires_at: fromDateInput(expiresAt),
          trial_ends_at: fromDateInput(trialEndsAt),
          current_period_start: fromDateInput(periodStart) ?? undefined,
          current_period_end: fromDateInput(periodEnd),
          payment_provider: paymentProvider || null,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";
  const labelCls =
    "flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      width={640}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 rounded-t-lg px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            {isEdit ? "Edit Store Subscription" : "Assign Subscription Plan"}
          </h2>
          <p className="text-violet-200 text-xs mt-0.5">
            {isEdit
              ? "Update the plan assignment for this store"
              : "Assign a plan to a store — invoice generated automatically"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pt-5 pb-2 flex flex-col gap-5 max-h-[66vh] overflow-y-auto">
        {validationError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
            <span className="shrink-0 text-base">⚠</span>
            {validationError}
          </div>
        )}

        {/* Store */}
        {!isEdit && (
          <div>
            <label className={labelCls}>
              <Store className="w-3 h-3" />
              Store
            </label>
            <Select
              showSearch
              placeholder="Search and select a store…"
              value={storeId || undefined}
              onChange={(v) => { setStoreId(v); setValidationError(null); }}
              className="w-full"
              size="large"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={stores.map((s) => ({
                value: s.id,
                label: `${s.store_name} (${s.store_slug})`,
              }))}
            />
          </div>
        )}

        {/* Plan */}
        <div>
          <label className={labelCls}>
            <BadgeCheck className="w-3 h-3" />
            Subscription Plan
          </label>
          <Select
            placeholder="Choose a plan…"
            value={planId || undefined}
            onChange={(v) => { setPlanId(v); setValidationError(null); }}
            className="w-full"
            size="large"
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} — ৳${p.price_monthly.toLocaleString()}/mo`,
            }))}
          />

          {/* Plan preview card */}
          {selectedPlan && (
            <div className="mt-2.5 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-violet-800 dark:text-violet-300">{selectedPlan.name}</p>
                {selectedPlan.description && (
                  <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5 line-clamp-1">
                    {selectedPlan.description}
                  </p>
                )}
                <p className="text-[10px] text-violet-400 mt-1 uppercase tracking-wider font-semibold">
                  {selectedPlan.currency}
                </p>
              </div>
              {planAmount !== null && (
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-extrabold text-violet-700 dark:text-violet-300">
                    ৳{planAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-violet-500 uppercase tracking-wider font-semibold">
                    {BILLING_CYCLE_LABELS[billingCycle]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Billing Cycle pills */}
        <div>
          <label className={labelCls}>Billing Cycle</label>
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

        {/* Status */}
        <div>
          <label className={labelCls}>Initial Status</label>
          <Select
            value={status}
            onChange={(v) => setStatus(v as SubscriptionStatus)}
            className="w-full"
            size="large"
            options={Object.values(SubscriptionStatus).map((s) => ({
              value: s,
              label: SUBSCRIPTION_STATUS_LABELS[s],
            }))}
          />
        </div>

        {/* Advanced toggle */}
        <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    <Calendar className="w-3 h-3" />
                    Started At
                  </label>
                  <input type="date" className={inputCls} value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Expires At</label>
                  <input type="date" className={inputCls} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Period Start</label>
                  <input type="date" className={inputCls} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Period End</label>
                  <input type="date" className={inputCls} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Trial Ends At</label>
                  <input type="date" className={inputCls} value={trialEndsAt} onChange={(e) => setTrialEndsAt(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Payment Provider</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. bkash, nagad, stripe"
                    value={paymentProvider}
                    onChange={(e) => setPaymentProvider(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded accent-violet-600"
                  checked={cancelsAtPeriodEnd}
                  onChange={(e) => setCancelsAtPeriodEnd(e.target.checked)}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cancel at period end</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Subscription stays active until the end of the billing period
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 bg-slate-50 dark:bg-black/[0.12] rounded-b-lg">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {!isEdit && "An invoice will be generated automatically on assign."}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.10] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 shadow-md shadow-violet-500/20 transition"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Assign Plan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
