"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
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

const toDateInput = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "";

const fromDateInput = (val: string) =>
  val ? new Date(val).toISOString() : null;

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

  // Create-only fields
  const [storeId, setStoreId] = useState("");

  // Shared fields
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.ACTIVE);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [startedAt, setStartedAt] = useState(toDateInput(new Date().toISOString()));
  const [expiresAt, setExpiresAt] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [periodStart, setPeriodStart] = useState(toDateInput(new Date().toISOString()));
  const [periodEnd, setPeriodEnd] = useState("");
  const [cancelsAtPeriodEnd, setCancelsAtPeriodEnd] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState("");

  useEffect(() => {
    setValidationError(null);
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
      setStatus(SubscriptionStatus.ACTIVE);
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

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);

    if (!isEdit && !storeId) {
      setValidationError("Please select a store.");
      return;
    }
    if (!planId) {
      setValidationError("Please select a plan.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && subscription) {
        const input: UpdateStoreSubscriptionInput = {
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
        };
        await onUpdate(subscription.id, input);
      } else {
        const selectedStore = stores.find((s) => s.id === storeId);
        if (!selectedStore) {
          setValidationError("Selected store not found.");
          return;
        }
        if (!selectedStore.owner_id) {
          setValidationError("This store has no owner assigned.");
          return;
        }
        const input: CreateStoreSubscriptionInput = {
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
        };
        await onCreate(input);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";
  const labelCls =
    "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={saving ? "Saving…" : isEdit ? "Save Changes" : "Assign Plan"}
      cancelText="Cancel"
      confirmLoading={saving}
      title={
        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
          {isEdit ? "Edit Store Subscription" : "Assign Subscription Plan"}
        </span>
      }
      width={580}
      styles={{ body: { padding: "8px 0" } }}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        {/* Validation error */}
        {validationError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
            <span className="font-semibold">⚠</span>
            {validationError}
          </div>
        )}

        {/* Store selector — only on create */}
        {!isEdit && (
          <div>
            <label className={labelCls}>Store *</label>
            <Select
              showSearch
              placeholder="Select a store"
              value={storeId || undefined}
              onChange={(v) => { setStoreId(v); setValidationError(null); }}
              className="w-full"
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

        {/* Plan selector */}
        <div>
          <label className={labelCls}>Plan *</label>
          <Select
            placeholder="Select a plan"
            value={planId || undefined}
            onChange={(v) => { setPlanId(v); setValidationError(null); }}
            className="w-full"
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} — ৳${p.price_monthly}/mo`,
            }))}
          />
        </div>

        {/* Status & Billing Cycle */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <Select
              value={status}
              onChange={(v) => setStatus(v as SubscriptionStatus)}
              className="w-full"
              options={Object.values(SubscriptionStatus).map((s) => ({
                value: s,
                label: SUBSCRIPTION_STATUS_LABELS[s],
              }))}
            />
          </div>
          <div>
            <label className={labelCls}>Billing Cycle</label>
            <Select
              value={billingCycle}
              onChange={(v) => setBillingCycle(v as BillingCycle)}
              className="w-full"
              options={Object.values(BillingCycle).map((c) => ({
                value: c,
                label: BILLING_CYCLE_LABELS[c],
              }))}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Started At</label>
            <input
              type="date"
              className={inputCls}
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Expires At</label>
            <input
              type="date"
              className={inputCls}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Trial Ends At</label>
            <input
              type="date"
              className={inputCls}
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Period End</label>
            <input
              type="date"
              className={inputCls}
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Payment provider */}
        <div>
          <label className={labelCls}>Payment Provider</label>
          <input
            className={inputCls}
            placeholder="e.g. sslcommerz, bkash, stripe"
            value={paymentProvider}
            onChange={(e) => setPaymentProvider(e.target.value)}
          />
        </div>

        {/* Cancels at period end */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-violet-600"
            checked={cancelsAtPeriodEnd}
            onChange={(e) => setCancelsAtPeriodEnd(e.target.checked)}
          />
          Cancel at end of current billing period
        </label>
      </div>
    </Modal>
  );
}
