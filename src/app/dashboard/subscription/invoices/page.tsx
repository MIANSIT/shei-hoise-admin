"use client";

import { useEffect, useState } from "react";
import { Modal, Select } from "antd";
import { FileText, Trash2, Eye, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getInvoices } from "@/lib/queries/subscription/invoices/getInvoices";
import { deleteInvoice } from "@/lib/queries/subscription/invoices/deleteInvoice";
import { markInvoicePaid } from "@/lib/queries/subscription/invoices/updateInvoice";
import {
  SubscriptionInvoice,
  InvoiceStatus,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/types/invoice.types";
import { BILLING_CYCLE_LABELS } from "@/lib/types/subscription.types";

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = INVOICE_STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
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
    const res = await markInvoicePaid(markPaidId, payMethod, payRef || undefined);
    if (res.success) {
      success("Invoice marked as paid");
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === markPaidId
            ? { ...i, status: "paid", paid_at: new Date().toISOString(), payment_method: payMethod, payment_reference: payRef || null }
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
    const matchSearch =
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.stores?.store_name?.toLowerCase().includes(q) ||
      inv.plan_name.toLowerCase().includes(q) ||
      inv.stores?.owner?.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const total = invoices.length;
  const totalUnpaid = invoices.filter((i) => i.status === "unpaid").length;
  const totalPaid = invoices.filter((i) => i.status === "paid").length;
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-[1080px] mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-violet-600" />
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Invoices
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              All subscription invoices — view, track payments, and manage records
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: total, color: "text-slate-700 dark:text-slate-200" },
              { label: "Unpaid", value: totalUnpaid, color: "text-orange-600 dark:text-orange-400" },
              { label: "Paid", value: totalPaid, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Revenue (Paid)", value: `৳${totalRevenue.toLocaleString()}`, color: "text-violet-600 dark:text-violet-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-4 py-3">
                <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
              placeholder="Search by invoice number, store or plan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
              className="w-[140px]"
              options={[
                { value: "all", label: "All Status" },
                { value: "unpaid", label: "Unpaid" },
                { value: "paid", label: "Paid" },
                { value: "canceled", label: "Canceled" },
                { value: "refunded", label: "Refunded" },
              ]}
            />
          </div>

          {/* Column headers */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center gap-4 px-5 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1">
              <div className="flex-[0_0_150px]">Invoice #</div>
              <div className="flex-[0_0_180px]">Store</div>
              <div className="flex-[0_0_120px]">Plan</div>
              <div className="flex-[0_0_80px] text-right">Amount</div>
              <div className="flex-[0_0_100px]">Status</div>
              <div className="flex-1">Due Date</div>
              <div className="w-[120px] shrink-0 text-right">Actions</div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-slate-200 dark:bg-white/[0.04]"
                  style={{ animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <div className="text-5xl mb-4 opacity-40">🧾</div>
              <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {search || statusFilter !== "all" ? "No invoices match your filter" : "No invoices yet"}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Invoices are auto-generated when you assign a plan to a store.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ animation: "slideDown 0.2s ease" }}>
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-5 py-3.5 bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl hover:border-slate-300 dark:hover:border-white/[0.14] transition"
                >
                  {/* Invoice number */}
                  <div className="flex-[0_0_150px] min-w-0">
                    <span className="text-sm font-bold font-mono text-violet-700 dark:text-violet-400">
                      {inv.invoice_number}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(inv.created_at)}
                    </div>
                  </div>

                  {/* Store */}
                  <div className="flex-[0_0_180px] min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {inv.stores?.store_name ?? "—"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {inv.stores?.owner?.email ?? ""}
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="flex-[0_0_120px] min-w-0">
                    <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {inv.plan_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {BILLING_CYCLE_LABELS[inv.billing_cycle]}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex-[0_0_80px] text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      ৳{inv.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex-[0_0_100px]">
                    <StatusBadge status={inv.status} />
                    {inv.status === "paid" && inv.payment_method && (
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        via {inv.payment_method}
                      </div>
                    )}
                  </div>

                  {/* Due date */}
                  <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(inv.due_date)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 w-[120px] justify-end shrink-0">
                    <button
                      title="View invoice"
                      onClick={() => router.push(`/dashboard/subscription/invoices/${inv.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {inv.status === "unpaid" && (
                      <button
                        title="Mark as paid"
                        onClick={() => setMarkPaidId(inv.id)}
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
      <Modal
        open={!!markPaidId}
        onCancel={() => { setMarkPaidId(null); setPayRef(""); setPayMethod("bkash"); }}
        onOk={handleMarkPaid}
        okText={marking ? "Saving…" : "Confirm Payment"}
        okButtonProps={{ style: { backgroundColor: "#10b981", borderColor: "#10b981" }, loading: marking }}
        cancelText="Cancel"
        title="Mark Invoice as Paid"
        width={420}
      >
        <div className="flex flex-col gap-3 py-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Payment Method
            </label>
            <Select
              value={payMethod}
              onChange={setPayMethod}
              className="w-full"
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
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
