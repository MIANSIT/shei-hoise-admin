"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { FileText, Trash2, Eye, CheckCircle, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getInvoices } from "@/lib/queries/subscription/invoices/getInvoices";
import { deleteInvoice } from "@/lib/queries/subscription/invoices/deleteInvoice";
import { markInvoicePaid, updateInvoice } from "@/lib/queries/subscription/invoices/updateInvoice";
import { updateStoreSubscription } from "@/lib/queries/subscription/storeSubscriptions/updateStoreSubscription";
import { addBillingCycle } from "@/lib/utils/billingCycle";
import {
  SubscriptionInvoice,
  InvoiceStatus,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/types/invoice.types";
import { BILLING_CYCLE_LABELS, SubscriptionStatus } from "@/lib/types/subscription.types";

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = INVOICE_STATUS_COLORS[status] ?? {
    bg: "bg-slate-100 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {INVOICE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const router = useRouter();
  const { success, error: notifyError } = useSheiNotification();
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("bkash");
  const [payRef, setPayRef] = useState("");
  const [marking, setMarking] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    const res = await getInvoices();
    if (res.success) setInvoices(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

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
      const periodStart = new Date();
      const periodEnd = addBillingCycle(periodStart, inv.billing_cycle);
      await Promise.all([
        inv.subscription_id
          ? updateStoreSubscription(inv.subscription_id, {
              status: SubscriptionStatus.ACTIVE,
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              expires_at: periodEnd.toISOString(),
              payment_provider: payMethod,
            })
          : Promise.resolve(),
        updateInvoice(markPaidId, {
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
        }),
      ]);
      success("Invoice marked as paid — subscription activated");
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === markPaidId
            ? {
                ...i,
                status: "paid",
                paid_at: periodStart.toISOString(),
                payment_method: payMethod,
                payment_reference: payRef || null,
                period_start: periodStart.toISOString(),
                period_end: periodEnd.toISOString(),
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

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const match =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      (inv.stores?.store_name?.toLowerCase() ?? "").includes(q) ||
      inv.plan_name.toLowerCase().includes(q) ||
      (inv.stores?.owner?.email?.toLowerCase() ?? "").includes(q);
    return match && (statusFilter === "all" || inv.status === statusFilter);
  });

  const totalUnpaid = invoices.filter((i) => i.status === "unpaid").length;
  const totalSubmitted = invoices.filter((i) => i.status === "submitted").length;
  const totalPaid = invoices.filter((i) => i.status === "paid").length;
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header band */}
        <div className="bg-white dark:bg-white/[0.025] border-b border-slate-200 dark:border-white/[0.07]">
          <div className="max-w-[1100px] mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
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

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
                className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 min-w-0"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <div className={`text-lg sm:text-xl font-extrabold truncate ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              placeholder="Search by invoice number, store name, plan, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
              className="w-full sm:w-[150px]"
              size="large"
              options={[
                { value: "all", label: "All Status" },
                { value: "unpaid", label: "Unpaid" },
                { value: "submitted", label: "Submitted" },
                { value: "paid", label: "Paid" },
                { value: "cancelled", label: "Cancelled" },
                { value: "refunded", label: "Refunded" },
              ]}
            />
          </div>

          {/* Column headers */}
          {!loading && filtered.length > 0 && (
            <div className="hidden lg:flex items-center gap-4 px-5 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1.5">
              <div className="flex-[0_0_160px]">Invoice #</div>
              <div className="flex-[0_0_190px]">Store / Owner</div>
              <div className="flex-[0_0_120px]">Plan</div>
              <div className="flex-[0_0_90px] text-right pr-4">Amount</div>
              <div className="flex-[0_0_110px]">Status</div>
            </div>
          )}

          {/* Invoice rows */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
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
                <FileText className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-base font-bold text-slate-500 dark:text-slate-400">
                {search || statusFilter !== "all" ? "No invoices match your filter" : "No invoices yet"}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Invoices are auto-generated when you assign a plan to a store.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ animation: "fadeSlide 0.2s ease" }}>
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className={`grid grid-cols-2 gap-x-3 gap-y-2 lg:flex lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-2 px-4 sm:px-5 py-4 bg-white dark:bg-white/[0.025] border rounded-2xl hover:shadow-sm transition group ${
                    inv.status === "submitted"
                      ? "border-blue-200 dark:border-blue-500/30"
                      : "border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14]"
                  }`}
                >
                  {/* Invoice # (+ status inline below lg) */}
                  <div className="col-span-2 lg:flex-[0_0_160px] min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-bold font-mono text-violet-700 dark:text-violet-400">
                        {inv.invoice_number}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(inv.created_at)}
                      </div>
                    </div>
                    <div className="lg:hidden shrink-0">
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>

                  {/* Store */}
                  <div className="col-span-2 lg:flex-[0_0_190px] min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {inv.stores?.store_name ?? "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {inv.stores?.owner?.email ?? ""}
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="lg:flex-[0_0_120px] min-w-0">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {inv.plan_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {BILLING_CYCLE_LABELS[inv.billing_cycle]}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="lg:flex-[0_0_90px] text-right lg:pr-4">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      ৳{inv.amount.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-slate-400">{inv.currency}</div>
                  </div>

                  {/* Status (lg+ only, shown inline below lg above) */}
                  <div className="hidden lg:block lg:flex-[0_0_110px]">
                    <StatusBadge status={inv.status} />
                    {inv.status === "paid" && inv.payment_method && (
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        via {inv.payment_method}
                      </div>
                    )}
                    {inv.status === "submitted" && (
                      <div className="text-[10px] text-blue-500 mt-0.5 font-semibold">
                        Pending confirm
                      </div>
                    )}
                  </div>
                  {/* Status sub-info (below lg only) */}
                  {(inv.status === "paid" && inv.payment_method) || inv.status === "submitted" ? (
                    <div className="col-span-2 lg:hidden -mt-1">
                      {inv.status === "paid" && inv.payment_method && (
                        <div className="text-[10px] text-slate-400 capitalize">
                          via {inv.payment_method}
                        </div>
                      )}
                      {inv.status === "submitted" && (
                        <div className="text-[10px] text-blue-500 font-semibold">
                          Pending confirm
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Due / payment info */}
                  <div className="col-span-2 lg:flex-1 lg:basis-[200px] text-xs text-slate-500 dark:text-slate-400">
                    <span>Due: {formatDate(inv.due_date)}</span>
                    {inv.status === "submitted" && inv.payment_reference && (
                      <div className="mt-0.5 font-mono text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
                        Ref: {inv.payment_reference}
                      </div>
                    )}
                    {inv.status === "submitted" && inv.sender_number && (
                      <div className="font-mono text-[11px] text-slate-400">
                        {inv.payment_method && <span className="capitalize mr-1">{inv.payment_method}:</span>}
                        {inv.sender_number}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 lg:w-[100px] lg:ml-auto flex items-center gap-1 justify-end shrink-0 border-t lg:border-t-0 border-slate-100 dark:border-white/[0.06] pt-2 lg:pt-0">
                    <button
                      title="View invoice"
                      onClick={() => router.push(`/dashboard/subscription/invoices/${inv.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {(inv.status === "unpaid" || inv.status === "submitted") && (
                      <button
                        title={inv.status === "submitted" ? "Confirm payment" : "Mark as paid"}
                        onClick={() => {
                          if (inv.status === "submitted") {
                            if (inv.payment_method) setPayMethod(inv.payment_method);
                            if (inv.payment_reference) setPayRef(inv.payment_reference);
                          }
                          setMarkPaidId(inv.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      title="Delete"
                      onClick={() => setDeleteId(inv.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-t-lg px-5 py-4 flex items-center gap-3">
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
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
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
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
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.10] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={marking}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 shadow-md shadow-emerald-500/20 transition"
              >
                {marking ? "Saving…" : "Confirm Payment"}
              </button>
            </div>
          </Modal>
        );
      })()}

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
