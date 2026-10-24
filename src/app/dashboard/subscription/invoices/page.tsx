"use client";

import { useEffect, useState } from "react";
import { InputNumber, Modal, Select } from "antd";
import { FileText, CheckCircle, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getInvoices } from "@/lib/queries/subscription/invoices/getInvoices";
import { deleteInvoice } from "@/lib/queries/subscription/invoices/deleteInvoice";
import { markInvoicePaid, updateInvoice } from "@/lib/queries/subscription/invoices/updateInvoice";
import { sendPaymentConfirmationEmail } from "@/lib/queries/subscription/invoices/sendPaymentConfirmationEmail";
import { updateStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/updateStoreSubscription";
import { addBillingCycle, monthsBetween } from "@/lib/utils/billingCycle";
import { withPendingPlanSwitch, withoutPendingPlanSwitch } from "@/lib/utils/planSwitch";
import { SubscriptionInvoice } from "@/lib/types/invoice.types";
import { BillingCycle, SubscriptionStatus } from "@/lib/types/subscription.types";
import { InvoicesTable, isOverdue } from "@/app/component/subscription/invoices/InvoicesTable";

type InvoiceTab = "all" | "submitted" | "unpaid" | "overdue" | "paid" | "closed";

const PAGE_SIZE = 15;

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Where a paid period starts when the admin doesn't override it: right now,
// or the end of the current period for an early renewal (so paid days stack
// instead of being discarded).
function defaultPeriodStart(inv: SubscriptionInvoice): Date {
  const now = new Date();
  const end = inv.store_subscriptions?.current_period_end
    ? new Date(inv.store_subscriptions.current_period_end)
    : null;
  return end && end > now ? end : now;
}

export default function InvoicesPage() {
  const { success, error: notifyError } = useSheiNotification();
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<InvoiceTab>("all");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("bkash");
  const [payRef, setPayRef] = useState("");
  const [marking, setMarking] = useState(false);
  const [startDate, setStartDate] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    const res = await getInvoices();
    if (res.success) setInvoices(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    // Deep link from the subscriptions table: /invoices?search=SHH-202610-1234
    const initial = new URLSearchParams(window.location.search).get("search");
    if (initial) setSearch(initial);
  }, []);

  const [editAmountInv, setEditAmountInv] = useState<SubscriptionInvoice | null>(null);
  const [newAmount, setNewAmount] = useState<number | null>(null);
  const [amountReason, setAmountReason] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);

  const openEditAmount = (inv: SubscriptionInvoice) => {
    setEditAmountInv(inv);
    setNewAmount(inv.amount);
    setAmountReason("");
  };

  const handleSaveAmount = async () => {
    if (!editAmountInv || newAmount === null) return;
    if (newAmount < 0 || newAmount === editAmountInv.amount) {
      notifyError("Enter a different, valid amount");
      return;
    }
    if (!amountReason.trim()) {
      notifyError("Please add a reason for the correction");
      return;
    }
    setSavingAmount(true);
    // Keep an audit trail in the invoice notes: old -> new, when, and why.
    const stamp = new Date().toLocaleString("en-GB");
    const line = `[${stamp}] Amount corrected ${editAmountInv.amount} -> ${newAmount}: ${amountReason.trim()}`;
    const notes = editAmountInv.notes ? `${editAmountInv.notes}
${line}` : line;
    const res = await updateInvoice(editAmountInv.id, { amount: newAmount, notes });
    if (res.success) {
      success("Invoice amount updated");
      setInvoices((prev) =>
        prev.map((i) => (i.id === editAmountInv.id ? { ...i, amount: newAmount, notes } : i)),
      );
      setEditAmountInv(null);
    } else {
      notifyError("Failed to update amount");
    }
    setSavingAmount(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await deleteInvoice(deleteId);
    if (res.success) {
      success("Invoice deleted");
      setInvoices((prev) => prev.filter((i) => i.id !== deleteId));
    } else {
      notifyError("Failed to delete invoice");
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const handleMarkPaid = async () => {
    if (!markPaidId) return;
    setMarking(true);
    const inv = invoices.find((i) => i.id === markPaidId);
    const res = await markInvoicePaid(markPaidId, payMethod, payRef || undefined);
    if (res.success && inv) {
      // Service period starts from confirmation, not from when it was requested —
      // otherwise a delayed approval silently eats days off the customer's paid period.
      // For a renewal confirmed before the current period ends, stack onto the
      // existing current_period_end instead, so early renewals don't discard
      // days the store already paid for.
      const now = new Date();
      // The admin picks the start date in the modal (defaults to the rule
      // above). Picking the default's own calendar day keeps its exact time.
      const defaultStart = defaultPeriodStart(inv);
      const periodStart =
        !startDate || startDate === toDateInput(defaultStart)
          ? defaultStart
          : new Date(`${startDate}T00:00:00`);
      const customMonths =
        inv.billing_cycle === BillingCycle.CUSTOM
          ? monthsBetween(new Date(inv.period_start), new Date(inv.period_end))
          : undefined;
      const periodEnd = addBillingCycle(periodStart, inv.billing_cycle, customMonths);
      // A plan switch that lands before the current period ends is queued
      // instead of applied now — otherwise the store gets the new plan's
      // features/limits for days it already paid for under the old plan.
      const currentPlanId = inv.store_subscriptions?.plan_id;
      // Only a period that starts in the future is an "early renewal".
      const isEarlyRenewal = periodStart > now;
      const isPlanSwitch = !!currentPlanId && currentPlanId !== inv.plan_id;
      const existingMetadata = (inv.store_subscriptions?.metadata as Record<string, unknown>) ?? {};
      const subscriptionUpdate =
        isPlanSwitch && isEarlyRenewal
          ? {
              status: SubscriptionStatus.ACTIVE,
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              expires_at: periodEnd.toISOString(),
              payment_provider: payMethod,
              canceled_at: null,
              metadata: withPendingPlanSwitch(existingMetadata, inv.plan_id, periodStart.toISOString()),
            }
          : {
              plan_id: inv.plan_id,
              status: SubscriptionStatus.ACTIVE,
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              expires_at: periodEnd.toISOString(),
              payment_provider: payMethod,
              canceled_at: null,
              metadata: withoutPendingPlanSwitch(existingMetadata),
            };
      await Promise.all([
        inv.subscription_id ? updateStoreSubscription(inv.subscription_id, subscriptionUpdate) : Promise.resolve(),
        updateInvoice(markPaidId, {
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
        }),
      ]);
      success("Invoice marked as paid — subscription activated");
      // Receipt to the store owner. A mail failure must not undo the payment.
      const mail = await sendPaymentConfirmationEmail(markPaidId);
      if (mail.success) success(`Receipt emailed to ${mail.to}`);
      else notifyError(`Payment saved, but the receipt email was not sent: ${mail.error}`);
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === markPaidId
            ? {
                ...i,
                status: "paid",
                paid_at: now.toISOString(),
                payment_method: payMethod,
                payment_reference: payRef || null,
                period_start: periodStart.toISOString(),
                period_end: periodEnd.toISOString(),
                store_subscriptions: i.store_subscriptions
                  ? {
                      ...i.store_subscriptions,
                      current_period_start: periodStart.toISOString(),
                      current_period_end: periodEnd.toISOString(),
                    }
                  : i.store_subscriptions,
              }
            : i.subscription_id === inv.subscription_id && i.store_subscriptions
              ? {
                  // Sibling invoices of the same subscription share its period, so
                  // keep their "last period" in sync without a refetch.
                  ...i,
                  store_subscriptions: {
                    ...i.store_subscriptions,
                    current_period_start: periodStart.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                  },
                }
              : i
        )
      );
    } else {
      notifyError("Failed to mark invoice as paid");
    }
    setMarking(false);
    setMarkPaidId(null);
    setPayRef("");
    setPayMethod("bkash");
  };

  const matchesTab = (inv: SubscriptionInvoice, t: InvoiceTab) => {
    switch (t) {
      case "submitted": return inv.status === "submitted";
      case "unpaid": return inv.status === "unpaid";
      case "overdue": return isOverdue(inv);
      case "paid": return inv.status === "paid";
      case "closed": return inv.status === "cancelled" || inv.status === "refunded";
      default: return true;
    }
  };

  const q = search.toLowerCase();
  const searched = invoices.filter(
    (inv) =>
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.stores?.store_name?.toLowerCase() ?? "").includes(q) ||
      inv.plan_name.toLowerCase().includes(q) ||
      (inv.stores?.owner?.email?.toLowerCase() ?? "").includes(q) ||
      (inv.payment_reference?.toLowerCase() ?? "").includes(q),
  );
  const filtered = searched.filter((inv) => matchesTab(inv, tab));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const tabs: { key: InvoiceTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "submitted", label: "Needs confirmation" },
    { key: "unpaid", label: "Unpaid" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
    { key: "closed", label: "Cancelled / Refunded" },
  ];

  const [emailingId, setEmailingId] = useState<string | null>(null);
  const handleResendReceipt = async (inv: SubscriptionInvoice) => {
    setEmailingId(inv.id);
    const mail = await sendPaymentConfirmationEmail(inv.id);
    if (mail.success) success(`Receipt emailed to ${mail.to}`);
    else notifyError(`Receipt email not sent: ${mail.error}`);
    setEmailingId(null);
  };

  const openConfirm = (inv: SubscriptionInvoice) => {
    if (inv.status === "submitted") {
      if (inv.payment_method) setPayMethod(inv.payment_method);
      if (inv.payment_reference) setPayRef(inv.payment_reference);
    }
    setStartDate(toDateInput(defaultPeriodStart(inv)));
    setMarkPaidId(inv.id);
  };

  const totalUnpaid = invoices.filter((i) => i.status === "unpaid").length;
  const totalSubmitted = invoices.filter((i) => i.status === "submitted").length;
  const totalPaid = invoices.filter((i) => i.status === "paid").length;
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/4 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header band */}
        <div className="bg-white dark:bg-white/2.5 border-b border-slate-200 dark:border-white/7">
          <div className="max-w-275 mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Invoices
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  All subscription invoices — verify payments and manage records
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-275 mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[
              {
                label: "Awaiting Payment",
                value: totalUnpaid,
                icon: <Clock className="w-4 h-4" />,
                color: "text-amber-600 dark:text-amber-400",
                iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
              },
              {
                label: "Submitted",
                value: totalSubmitted,
                icon: <AlertCircle className="w-4 h-4" />,
                color: "text-blue-600 dark:text-blue-400",
                iconBg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
              },
              {
                label: "Paid",
                value: totalPaid,
                icon: <CheckCircle className="w-4 h-4" />,
                color: "text-emerald-600 dark:text-emerald-400",
                iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Total Revenue",
                value: `৳${totalRevenue.toLocaleString()}`,
                icon: <TrendingUp className="w-4 h-4" />,
                color: "text-violet-700 dark:text-violet-400",
                iconBg: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-white/2.5 border border-slate-200 dark:border-white/7 rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 min-w-0"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <div className={`text-lg sm:text-xl font-extrabold truncate ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            className="w-full mb-4 px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            placeholder="Search by invoice number, store, plan, email or transaction ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          {/* Status tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
            {tabs.map((t) => {
              const count = searched.filter((inv) => matchesTab(inv, t.key)).length;
              const active = tab === t.key;
              const urgent = (t.key === "submitted" || t.key === "overdue") && count > 0;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${
                    active
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {t.label}
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      active
                        ? "bg-white/20 text-white"
                        : urgent
                          ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-slate-200 dark:bg-white/4"
                  style={{ animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-base font-bold text-muted-foreground">
                {search || tab !== "all" ? "No invoices match your filter" : "No invoices yet"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Invoices are auto-generated when you assign a plan to a store.
              </p>
            </div>
          ) : (
            <div style={{ animation: "fadeSlide 0.2s ease" }}>
              <InvoicesTable
                invoices={pageRows}
                onConfirm={openConfirm}
                onEditAmount={openEditAmount}
                onResendReceipt={handleResendReceipt}
                emailingId={emailingId}
                onDelete={(id) => setDeleteId(id)}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-accent transition"
                    >
                      Previous
                    </button>
                    <span className="tabular-nums">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-accent transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mark Paid Modal */}
      {(() => {
        const activeInv = invoices.find((i) => i.id === markPaidId);
        const isSubmittedInv = activeInv?.status === "submitted";
        return (
          <Modal
            open={!!markPaidId}
            onCancel={() => { setMarkPaidId(null); setPayRef(""); setPayMethod("bkash"); }}
            footer={null}
            title={null}
            width={460}
            styles={{ body: { padding: 0 } }}
          >
            <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-t-lg px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isSubmittedInv ? "Confirm Customer Payment" : "Mark Invoice as Paid"}
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  {activeInv?.invoice_number}
                </p>
              </div>
            </div>

            <div className="px-5 py-5 flex flex-col gap-4">
              {isSubmittedInv && activeInv && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-3">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                    Customer Submitted
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      ৳{activeInv.amount.toLocaleString()} {activeInv.currency}
                    </span>
                    <span className="text-slate-500">Method:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {activeInv.payment_method ?? "—"}
                    </span>
                    <span className="text-slate-500">Ref / TxID:</span>
                    <span className="font-mono font-bold text-violet-700 dark:text-violet-400">
                      {activeInv.payment_reference ?? "—"}
                    </span>
                    <span className="text-slate-500">Sender No:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {activeInv.sender_number ?? "—"}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Payment Method
                </label>
                <Select
                  value={payMethod}
                  onChange={setPayMethod}
                  className="w-full"
                  size="large"
                  options={[
                    { value: "bkash", label: "bKash" },
                    { value: "nagad", label: "Nagad" },
                    { value: "bank", label: "Bank Transfer" },
                    { value: "cash", label: "Cash" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
              {activeInv && (() => {
                const defaultStart = defaultPeriodStart(activeInv);
                const chosen = startDate ? new Date(`${startDate}T00:00:00`) : defaultStart;
                const months =
                  activeInv.billing_cycle === BillingCycle.CUSTOM
                    ? monthsBetween(new Date(activeInv.period_start), new Date(activeInv.period_end))
                    : undefined;
                const end = addBillingCycle(chosen, activeInv.billing_cycle, months);
                const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                const isDefault = startDate === toDateInput(defaultStart);
                const sub = activeInv.store_subscriptions;
                const lastStart = sub?.current_period_start ? new Date(sub.current_period_start) : null;
                const lastEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
                const daysSinceEnd = lastEnd ? Math.floor((Date.now() - lastEnd.getTime()) / 86400000) : null;
                const endedLabel =
                  daysSinceEnd === null
                    ? ""
                    : daysSinceEnd > 0
                      ? `ended ${daysSinceEnd} day${daysSinceEnd > 1 ? "s" : ""} ago`
                      : daysSinceEnd === 0
                        ? "ends today"
                        : `${-daysSinceEnd} day${daysSinceEnd < -1 ? "s" : ""} left`;
                return (
                  <div>
                    <div className="mb-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/4 px-4 py-3">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                        Last subscription period
                      </p>
                      {lastEnd ? (
                        <>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {lastStart ? `${fmt(lastStart)} → ` : "Until "}{fmt(lastEnd)}
                          </p>
                          <p className={`text-xs mt-0.5 font-medium ${daysSinceEnd !== null && daysSinceEnd > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {endedLabel}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            <button
                              type="button"
                              onClick={() => setStartDate(toDateInput(lastEnd))}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-400 transition"
                            >
                              From when it ended ({fmt(lastEnd)})
                            </button>
                            <button
                              type="button"
                              onClick={() => setStartDate(toDateInput(new Date()))}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-400 transition"
                            >
                              From today
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">No previous period — this is a first subscription.</p>
                      )}
                    </div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Subscription starts on
                    </label>
                    <input
                      type="date"
                      className={inputCls}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                      New period: <strong>{fmt(chosen)} → {fmt(end)}</strong>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {isDefault
                        ? "Default: from today, or from the end of the current period if it hasn't ended yet."
                        : "Custom start date. Set it to the day the old period ended to avoid a gap."}
                    </p>
                  </div>
                );
              })()}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Transaction / Reference ID (optional)
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. TX123456"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                onClick={() => { setMarkPaidId(null); setPayRef(""); setPayMethod("bkash"); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/6 hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={marking}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 shadow-md shadow-emerald-500/20 transition"
              >
                {marking ? "Saving…" : "Confirm Payment"}
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* Edit Amount Modal */}
      <Modal
        open={!!editAmountInv}
        onCancel={() => setEditAmountInv(null)}
        onOk={handleSaveAmount}
        okText={savingAmount ? "Saving…" : "Save amount"}
        okButtonProps={{ loading: savingAmount }}
        cancelText="Cancel"
        title={`Correct amount — ${editAmountInv?.invoice_number ?? ""}`}
        width={440}
      >
        <div className="flex flex-col gap-4 pt-1">
          {editAmountInv?.status === "paid" && (
            <div className="text-xs rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              This invoice is already paid. Changing the amount corrects the record of what was
              collected; it does not change the subscription period.
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Amount ({editAmountInv?.currency}) — currently ৳{editAmountInv?.amount.toLocaleString()}
            </label>
            <InputNumber
              className="w-full"
              size="large"
              min={0}
              value={newAmount}
              onChange={(v) => setNewAmount(v)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Reason (saved in invoice notes)
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Customer paid ৳1,998 for 2 months"
              value={amountReason}
              onChange={(e) => setAmountReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onOk={handleDelete}
        okText={deleting ? "Deleting…" : "Delete"}
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        title="Delete Invoice"
        width={400}
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Permanently delete this invoice? This cannot be undone.
        </p>
      </Modal>
    </>
  );
}
