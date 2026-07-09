"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import {
  Plus, Pencil, Trash2, CreditCard, XCircle, Store,
  FileText, TrendingUp, Users, AlertCircle, CheckCircle2, Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getStoreSubscriptions } from "@/lib/queries/subscription/storeSubscriptions/getStoreSubscriptions";
import { createStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/createStoreSubscription";
import {
  updateStoreSubscription,
  cancelStoreSubscription,
} from "@/lib/queries/subscription/storeSubscriptions/updateStoreSubscription";
import { deleteStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/deleteStoreSubscription";
import { getSubscriptionPlans } from "@/lib/queries/subscription/plans/getPlans";
import { getAllStoresForDropdown } from "@/lib/queries/subscription/getAllStores";
import { createInvoice } from "@/lib/queries/subscription/invoices/createInvoice";
import { SubscriptionFormModal } from "@/app/component/subscription/storeSubscriptions/SubscriptionFormModal";
import {
  StoreSubscription,
  SubscriptionPlan,
  SimpleStore,
  SubscriptionStatus,
  BillingCycle,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  BILLING_CYCLE_LABELS,
  CreateStoreSubscriptionInput,
  UpdateStoreSubscriptionInput,
} from "@/lib/types/subscription.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const c = SUBSCRIPTION_STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function calcAmount(plan: SubscriptionPlan, cycle: BillingCycle): number {
  if (cycle === BillingCycle.YEARLY) return plan.price_yearly || plan.price_monthly * 12;
  if (cycle === BillingCycle.HALF_YEARLY) return plan.price_monthly * 6;
  return plan.price_monthly;
}

function SubscriptionRow({
  sub,
  onEdit,
  onDelete,
  onCancel,
  onStatusChange,
}: {
  sub: StoreSubscription;
  onEdit: (sub: StoreSubscription) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onStatusChange: (id: string, status: SubscriptionStatus) => void;
}) {
  const store = sub.stores;
  const plan = sub.subscription_plans;
  const owner = store?.owner;
  const latestInvoice = sub.subscription_invoices?.[0];
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const planAmount = plan
    ? calcAmount(plan as SubscriptionPlan, sub.billing_cycle)
    : null;

  const initials = store?.store_name
    ? store.store_name.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div
      className={`bg-white dark:bg-white/[0.025] border rounded-2xl overflow-hidden transition-all duration-200 ${
        expanded
          ? "border-violet-200 dark:border-violet-500/30 shadow-lg shadow-violet-500/5 dark:shadow-black/40"
          : "border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] hover:shadow-sm"
      }`}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-500/30">
          {initials}
        </div>

        {/* Store + owner */}
        <div className="flex-[0_0_200px] min-w-0">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
            {store?.store_name ?? "—"}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {owner ? `${owner.first_name} ${owner.last_name} · ${owner.email}` : sub.user_id}
          </div>
        </div>

        {/* Plan + amount */}
        <div className="flex-[0_0_170px] min-w-0">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
            {plan?.name ?? "—"}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {planAmount !== null && (
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                ৳{planAmount.toLocaleString()}
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              / {BILLING_CYCLE_LABELS[sub.billing_cycle]}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-[0_0_120px]">
          <StatusBadge status={sub.status} />
        </div>

        {/* Period */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Period</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {formatDate(sub.current_period_start)}
            {sub.current_period_end && (
              <span className="text-slate-400"> → {formatDate(sub.current_period_end)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select
            size="small"
            value={sub.status}
            onChange={(v) => onStatusChange(sub.id, v as SubscriptionStatus)}
            className="w-[108px]"
            options={Object.values(SubscriptionStatus).map((s) => ({
              value: s,
              label: SUBSCRIPTION_STATUS_LABELS[s],
            }))}
          />
          <button
            title="Edit"
            onClick={() => onEdit(sub)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            title="Cancel subscription"
            onClick={() => onCancel(sub.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
          <button
            title="Delete"
            onClick={() => onDelete(sub.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div
          className="border-t border-slate-100 dark:border-white/[0.05] px-5 py-4 bg-slate-50/60 dark:bg-black/[0.08] grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ animation: "fadeSlide 0.18s ease" }}
        >
          {[
            { label: "Started", value: formatDate(sub.started_at) },
            { label: "Expires", value: formatDate(sub.expires_at) },
            { label: "Trial Ends", value: formatDate(sub.trial_ends_at) },
            { label: "Canceled At", value: formatDate(sub.canceled_at) },
            { label: "Cancel at Period End", value: sub.cancels_at_period_end ? "Yes" : "No" },
            { label: "Payment Provider", value: sub.payment_provider ?? "—" },
            { label: "Plan Slug", value: plan?.slug ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{value}</div>
            </div>
          ))}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Invoice</div>
            {latestInvoice ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/subscription/invoices/${latestInvoice.id}`);
                }}
                className="flex items-center gap-1 text-xs font-mono font-bold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                {latestInvoice.invoice_number}
              </button>
            ) : (
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">—</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreSubscriptionsPage() {
  const router = useRouter();
  const { success, error: notifyError } = useSheiNotification();
  const [subs, setSubs] = useState<StoreSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stores, setStores] = useState<SimpleStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StoreSubscription | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelPeriodEnd, setCancelPeriodEnd] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [subsRes, plansRes, storesRes] = await Promise.all([
      getStoreSubscriptions(),
      getSubscriptionPlans(),
      getAllStoresForDropdown(),
    ]);
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
        const amount = calcAmount(plan, input.billing_cycle ?? BillingCycle.MONTHLY);
        const periodStart = sub.current_period_start || sub.started_at || new Date().toISOString();
        const periodEnd = sub.current_period_end || sub.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const dueDate = new Date(Date.now() + PAYMENT_DETAILS.invoiceDueDays * 24 * 60 * 60 * 1000).toISOString();
        await createInvoice({
          subscription_id: sub.id, store_id: sub.store_id, user_id: sub.user_id,
          plan_id: sub.plan_id, plan_name: plan.name, amount,
          currency: plan.currency, billing_cycle: input.billing_cycle ?? BillingCycle.MONTHLY,
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
      success("Subscription updated");
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...input } : s)));
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

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase();
    const match =
      !q ||
      (s.stores?.store_name?.toLowerCase() ?? "").includes(q) ||
      (s.subscription_plans?.name?.toLowerCase() ?? "").includes(q) ||
      (s.stores?.owner?.email?.toLowerCase() ?? "").includes(q);
    return match && (statusFilter === "all" || s.status === statusFilter);
  });

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
        <div className="bg-white dark:bg-white/[0.025] border-b border-slate-200 dark:border-white/[0.07]">
          <div className="max-w-[1100px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
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
                  onClick={() => router.push("/dashboard/subscription/invoices")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10] text-slate-700 dark:text-slate-300 text-sm font-semibold transition"
                >
                  <FileText className="w-4 h-4" />
                  Invoices
                </button>
                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-violet-500/25 transition"
                >
                  <Plus className="w-4 h-4" />
                  Assign Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: subs.length,
                icon: <Users className="w-4 h-4" />,
                color: "text-slate-700 dark:text-slate-200",
                iconBg: "bg-slate-100 dark:bg-white/[0.08] text-slate-500",
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
                className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <div>
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              placeholder="Search by store name, plan, or owner email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as SubscriptionStatus | "all")}
              className="w-[160px]"
              size="large"
              options={[
                { value: "all", label: "All Statuses" },
                ...Object.values(SubscriptionStatus).map((s) => ({
                  value: s,
                  label: SUBSCRIPTION_STATUS_LABELS[s],
                })),
              ]}
            />
          </div>

          {/* Column headers */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center gap-4 px-5 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">
              <div className="w-10 shrink-0" />
              <div className="flex-[0_0_200px]">Store / Owner</div>
              <div className="flex-[0_0_170px]">Plan / Amount</div>
              <div className="flex-[0_0_120px]">Status</div>
              <div className="flex-1">Period</div>
              <div className="w-[220px] shrink-0 text-right">Actions</div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-200 dark:bg-white/[0.04]"
                  style={{ animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-base font-bold text-slate-500 dark:text-slate-400">
                {search || statusFilter !== "all" ? "No subscriptions match your filter" : "No store subscriptions yet"}
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {!search && statusFilter === "all" && 'Click "Assign Plan" to get started'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ animation: "fadeSlide 0.2s ease" }}>
              {filtered.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  sub={sub}
                  onEdit={(s) => { setEditing(s); setModalOpen(true); }}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onCancel={(id) => { setCancelConfirm(id); setCancelPeriodEnd(false); }}
                  onStatusChange={handleStatusChange}
                />
              ))}
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
        <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-white/[0.04] rounded-xl px-4 py-3 border border-slate-200 dark:border-white/[0.07]">
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
