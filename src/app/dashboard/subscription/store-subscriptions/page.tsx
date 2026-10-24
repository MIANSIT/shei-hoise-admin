"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import {
  Plus, CreditCard, XCircle, Store,
  FileText, Users, AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getStoreSubscriptionsPageData } from "@/lib/queries/subscription/storeSubscriptions/getStoreSubscriptionsPageData";
import { createStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/createStoreSubscription";
import {
  updateStoreSubscription,
  cancelStoreSubscription,
} from "@/lib/queries/subscription/storeSubscriptions/updateStoreSubscription";
import { deleteStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/deleteStoreSubscription";
import { createInvoice } from "@/lib/queries/subscription/invoices/createInvoice";
import { updateInvoice } from "@/lib/queries/subscription/invoices/updateInvoice";
import { calcCycleAmount, monthsBetween } from "@/lib/utils/billingCycle";
import { promoteDuePlanSwitches } from "@/lib/queries/subscription/storeSubscriptions/promoteDuePlanSwitches";
import { SubscriptionFormModal } from "@/app/component/subscription/storeSubscriptions/SubscriptionFormModal";
import { StoreSpendTable } from "@/app/component/subscription/storeSubscriptions/StoreSpendTable";
import { StoreSubscriptionsTable } from "@/app/component/subscription/storeSubscriptions/StoreSubscriptionsTable";
import { RenewSubscriptionModal } from "@/app/component/subscription/storeSubscriptions/RenewSubscriptionModal";
import {
  StoreSubscription,
  SubscriptionPlan,
  SimpleStore,
  SubscriptionStatus,
  BillingCycle,
  SUBSCRIPTION_STATUS_LABELS,
  CreateStoreSubscriptionInput,
  UpdateStoreSubscriptionInput,
} from "@/lib/types/subscription.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";

export default function StoreSubscriptionsPage() {
  const router = useRouter();
  const { success, error: notifyError } = useSheiNotification();
  const [subs, setSubs] = useState<StoreSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stores, setStores] = useState<SimpleStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");
  const [view, setView] = useState<"subscriptions" | "spend">("subscriptions");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StoreSubscription | null>(null);

  const [renewTarget, setRenewTarget] = useState<StoreSubscription | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelPeriodEnd, setCancelPeriodEnd] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [applyingSwitches, setApplyingSwitches] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { subs: subsRes, plans: plansRes, stores: storesRes } =
      await getStoreSubscriptionsPageData();
    if (subsRes.success) setSubs(subsRes.data);
    if (plansRes.success) setPlans(plansRes.data);
    if (storesRes.success) setStores(storesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (input: CreateStoreSubscriptionInput) => {
    const res = await createStoreSubscription(input);
    if (res.success && res.data) {
      const sub = res.data as {
        id: string; store_id: string; user_id: string; plan_id: string;
        billing_cycle: BillingCycle; started_at: string;
        current_period_start: string; current_period_end?: string | null; expires_at?: string | null;
      };
      const plan = plans.find((p) => p.id === input.plan_id);
      if (plan) {
        const cycle = input.billing_cycle ?? BillingCycle.MONTHLY;
        const periodStart = sub.current_period_start || sub.started_at || new Date().toISOString();
        const periodEnd = sub.current_period_end || sub.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const customMonths =
          cycle === BillingCycle.CUSTOM ? monthsBetween(new Date(periodStart), new Date(periodEnd)) : undefined;
        const amount = calcCycleAmount(plan, cycle, customMonths);
        const dueDate = new Date(Date.now() + PAYMENT_DETAILS.invoiceDueDays * 24 * 60 * 60 * 1000).toISOString();
        await createInvoice({
          subscription_id: sub.id, store_id: sub.store_id, user_id: sub.user_id,
          plan_id: sub.plan_id, plan_name: plan.name, amount,
          currency: plan.currency, billing_cycle: cycle,
          period_start: periodStart, period_end: periodEnd, due_date: dueDate,
        });
      }
      success("Plan assigned & invoice generated automatically");
      await fetchAll();
      setModalOpen(false);
    } else {
      notifyError("Failed to assign subscription");
    }
  };

  const handleUpdate = async (id: string, input: UpdateStoreSubscriptionInput) => {
    const res = await updateStoreSubscription(id, input);
    if (res.success) {
      // The invoice for the current period must follow the subscription's
      // period, otherwise the two drift apart (and the billed amount no longer
      // matches the period length). Amount is deliberately left alone - money
      // already collected is corrected explicitly from the Invoices page.
      const sub = subs.find((s) => s.id === id);
      const live = (sub?.subscription_invoices ?? []).filter(
        (inv) => inv.status !== "cancelled" && inv.status !== "canceled" && inv.status !== "refunded",
      );
      // Newest paid invoice covers the current period; a lone unpaid invoice
      // (fresh subscription) does too. A pending renewal must be left alone.
      const billed = live.find((inv) => inv.status === "paid") ?? (live.length === 1 ? live[0] : undefined);
      const newStart = input.current_period_start;
      const newEnd = input.current_period_end;
      const startChanged = !!newStart && newStart !== sub?.current_period_start;
      const endChanged = newEnd !== undefined && newEnd !== (sub?.current_period_end ?? null);

      let invoiceSynced = false;
      let invoicePatch: { period_start?: string; period_end?: string } = {};
      if (billed && (startChanged || endChanged)) {
        invoicePatch = {
          ...(newStart ? { period_start: newStart } : {}),
          ...(newEnd ? { period_end: newEnd } : {}),
        };
        const invRes = await updateInvoice(billed.id, invoicePatch);
        invoiceSynced = invRes.success;
        if (!invRes.success) {
          notifyError(`Subscription saved, but invoice ${billed.invoice_number} could not be updated`);
        }
      }

      success(invoiceSynced ? `Subscription updated — invoice ${billed?.invoice_number} period synced` : "Subscription updated");
      setSubs((prev) =>
        prev.map((s) =>
          s.id !== id
            ? s
            : {
                ...s,
                ...input,
                subscription_invoices: invoiceSynced
                  ? s.subscription_invoices?.map((inv) => (inv.id === billed?.id ? { ...inv, ...invoicePatch } : inv))
                  : s.subscription_invoices,
              },
        ),
      );
      setModalOpen(false);
      setEditing(null);
    } else {
      notifyError("Failed to update subscription");
    }
  };

  const handleStatusChange = async (id: string, status: SubscriptionStatus) => {
    const res = await updateStoreSubscription(id, { status });
    if (res.success) {
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      success("Status updated");
    } else {
      notifyError("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const res = await deleteStoreSubscription(deleteConfirm);
    if (res.success) {
      success("Subscription deleted");
      setSubs((prev) => prev.filter((s) => s.id !== deleteConfirm));
    } else {
      notifyError("Failed to delete subscription");
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    setCanceling(true);
    const res = await cancelStoreSubscription(cancelConfirm, cancelPeriodEnd);
    if (res.success) {
      success(cancelPeriodEnd ? "Subscription will cancel at period end" : "Subscription canceled");
      await fetchAll();
    } else {
      notifyError("Failed to cancel subscription");
    }
    setCanceling(false);
    setCancelConfirm(null);
    setCancelPeriodEnd(false);
  };

  const handleApplyDueSwitches = async () => {
    setApplyingSwitches(true);
    const res = await promoteDuePlanSwitches();
    if (res.success) {
      success(res.promoted > 0 ? `Applied ${res.promoted} due plan switch(es)` : "No plan switches were due yet");
      if (res.promoted > 0) await fetchAll();
    } else {
      notifyError("Failed to apply due plan switches");
    }
    setApplyingSwitches(false);
  };

  const handleSyncInvoiceDates = async (sub: StoreSubscription, invoiceId: string) => {
    const patch = {
      period_start: sub.current_period_start,
      ...(sub.current_period_end ? { period_end: sub.current_period_end } : {}),
    };
    const res = await updateInvoice(invoiceId, patch);
    if (res.success) {
      success("Invoice dates now match the subscription period");
      setSubs((prev) =>
        prev.map((s) =>
          s.id !== sub.id
            ? s
            : {
                ...s,
                subscription_invoices: s.subscription_invoices?.map((inv) =>
                  inv.id === invoiceId ? { ...inv, ...patch } : inv,
                ),
              },
        ),
      );
    } else {
      notifyError("Failed to sync invoice dates");
    }
  };

  const openRenew = (sub: StoreSubscription) => {
    const pending = sub.subscription_invoices?.[0];
    if (pending && (pending.status === "unpaid" || pending.status === "submitted")) {
      notifyError(`There's already a pending invoice (${pending.invoice_number}) for this subscription — resolve it before renewing.`);
      return;
    }
    setRenewTarget(sub);
  };

  const handleRenew = async ({
    plan_id,
    billing_cycle,
    period_start,
    period_end,
  }: {
    plan_id: string;
    billing_cycle: BillingCycle;
    period_start: string;
    period_end: string;
  }) => {
    if (!renewTarget) return;
    const plan = plans.find((p) => p.id === plan_id);
    if (!plan) {
      notifyError("Plan not found");
      return;
    }
    const customMonths =
      billing_cycle === BillingCycle.CUSTOM
        ? monthsBetween(new Date(period_start), new Date(period_end))
        : undefined;
    const amount = calcCycleAmount(plan, billing_cycle, customMonths);
    const dueDate = new Date(Date.now() + PAYMENT_DETAILS.invoiceDueDays * 24 * 60 * 60 * 1000);

    const res = await createInvoice({
      subscription_id: renewTarget.id,
      store_id: renewTarget.store_id,
      user_id: renewTarget.user_id,
      plan_id,
      plan_name: plan.name,
      amount,
      currency: plan.currency,
      billing_cycle,
      period_start,
      period_end,
      due_date: dueDate.toISOString(),
    });
    if (res.success) {
      success("Renewal invoice generated");
      setRenewTarget(null);
      await fetchAll();
    } else {
      notifyError("Failed to generate renewal invoice");
    }
  };

  const searched = subs.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.stores?.store_name?.toLowerCase() ?? "").includes(q) ||
      (s.subscription_plans?.name?.toLowerCase() ?? "").includes(q) ||
      (s.stores?.owner?.email?.toLowerCase() ?? "").includes(q)
    );
  });
  const filtered = searched.filter((s) => statusFilter === "all" || s.status === statusFilter);

  const totalActive = subs.filter((s) => s.status === SubscriptionStatus.ACTIVE).length;
  const totalIncomplete = subs.filter((s) => s.status === SubscriptionStatus.INCOMPLETE).length;
  const totalCanceled = subs.filter((s) => s.status === SubscriptionStatus.CANCELED).length;

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Page header band */}
        <div className="bg-white dark:bg-white/2.5 border-b border-slate-200 dark:border-white/7">
          <div className="max-w-275 mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    Store Subscriptions
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage plan assignments across all stores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyDueSwitches}
                  disabled={applyingSwitches}
                  title="Apply any queued plan switches whose effective date has arrived — this also runs automatically every hour"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/6 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60 text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
                >
                  <RefreshCw className={`w-4 h-4 ${applyingSwitches ? "animate-spin" : ""}`} />
                  {applyingSwitches ? "Applying…" : "Apply Due Switches"}
                </button>
                <button
                  onClick={() => router.push("/dashboard/subscription/invoices")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/6 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
                >
                  <FileText className="w-4 h-4" />
                  Invoices
                </button>
                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-violet-500/25 transition"
                >
                  <Plus className="w-4 h-4" />
                  Assign Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-275 mx-auto px-4 sm:px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: subs.length,
                icon: <Users className="w-4 h-4" />,
                color: "text-slate-700 dark:text-slate-200",
                iconBg: "bg-slate-100 dark:bg-white/8 text-slate-500",
              },
              {
                label: "Active",
                value: totalActive,
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: "text-emerald-600 dark:text-emerald-400",
                iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Incomplete",
                value: totalIncomplete,
                icon: <AlertCircle className="w-4 h-4" />,
                color: "text-amber-600 dark:text-amber-400",
                iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
              },
              {
                label: "Canceled",
                value: totalCanceled,
                icon: <XCircle className="w-4 h-4" />,
                color: "text-red-600 dark:text-red-400",
                iconBg: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-white/2.5 border border-slate-200 dark:border-white/7 rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* View toggle */}
          <div className="inline-flex p-1 mb-4 rounded-xl bg-muted border border-border">
            {([
              { key: "subscriptions", label: "Subscriptions" },
              { key: "spend", label: "Spend by store" },
            ] as const).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  view === v.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              placeholder="Search by store name, plan, or owner email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {view === "subscriptions" && <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as SubscriptionStatus | "all")}
              className="w-40"
              size="large"
              options={[
                { value: "all", label: "All Statuses" },
                ...Object.values(SubscriptionStatus).map((s) => ({
                  value: s,
                  label: SUBSCRIPTION_STATUS_LABELS[s],
                })),
              ]}
            />}
          </div>

          {!loading && view === "spend" ? (
            searched.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground bg-card rounded-3xl border border-dashed border-border">
                No stores match your search
              </div>
            ) : (
              <StoreSpendTable subs={searched} />
            )
          ) : loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-200 dark:bg-white/4"
                  style={{ animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-white/2 rounded-3xl border border-dashed border-slate-200 dark:border-white/8">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-base font-bold text-slate-500 dark:text-slate-400">
                {search || statusFilter !== "all" ? "No subscriptions match your filter" : "No store subscriptions yet"}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {!search && statusFilter === "all" && 'Click "Assign Plan" to get started'}
              </p>
            </div>
          ) : (
            <div style={{ animation: "fadeSlide 0.2s ease" }}>
              <StoreSubscriptionsTable
                subs={filtered}
                plans={plans}
                onEdit={(s) => { setEditing(s); setModalOpen(true); }}
                onDelete={(id) => setDeleteConfirm(id)}
                onCancel={(id) => { setCancelConfirm(id); setCancelPeriodEnd(false); }}
                onStatusChange={handleStatusChange}
                onRenew={openRenew}
                onSyncInvoiceDates={handleSyncInvoiceDates}
              />
            </div>
          )}
        </div>
      </div>

      <SubscriptionFormModal
        open={modalOpen}
        subscription={editing}
        plans={plans}
        stores={stores}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <RenewSubscriptionModal
        open={!!renewTarget}
        subscription={renewTarget}
        plans={plans}
        onClose={() => setRenewTarget(null)}
        onRenew={handleRenew}
      />

      {/* Cancel Confirm */}
      <Modal
        open={!!cancelConfirm}
        onCancel={() => { setCancelConfirm(null); setCancelPeriodEnd(false); }}
        onOk={handleCancel}
        okText={canceling ? "Canceling…" : "Confirm Cancel"}
        okButtonProps={{ danger: true, loading: canceling }}
        cancelText="Keep Active"
        title="Cancel Subscription"
        width={420}
      >
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          How do you want to cancel this subscription?
        </p>
        <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-white/4 rounded-xl px-4 py-3 border border-slate-200 dark:border-white/7">
          <input
            type="checkbox"
            className="w-4 h-4 accent-amber-500"
            checked={cancelPeriodEnd}
            onChange={(e) => setCancelPeriodEnd(e.target.checked)}
          />
          Cancel at end of current billing period (not immediately)
        </label>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onOk={handleDelete}
        okText={deleting ? "Deleting…" : "Delete"}
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        title="Delete Subscription"
        width={400}
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Permanently delete this subscription record? This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
