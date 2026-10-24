"use client";

import { CheckCircle, Eye, Mail, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
  SubscriptionInvoice,
} from "@/lib/types/invoice.types";
import { BILLING_CYCLE_LABELS } from "@/lib/types/subscription.types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(inv: SubscriptionInvoice) {
  return inv.status === "unpaid" && new Date(inv.due_date).getTime() < Date.now();
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = INVOICE_STATUS_COLORS[status] ?? INVOICE_STATUS_COLORS.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {INVOICE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DueCell({ inv }: { inv: SubscriptionInvoice }) {
  if (inv.status !== "unpaid" && inv.status !== "submitted") {
    return <span className="text-xs text-muted-foreground">{formatDate(inv.due_date)}</span>;
  }

  const days = Math.ceil((new Date(inv.due_date).getTime() - Date.now()) / DAY_MS);
  const overdue = days < 0;
  const tone = overdue
    ? "text-red-600 dark:text-red-400"
    : days <= 3
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";
  const text = overdue
    ? `Overdue ${Math.abs(days)}d`
    : days === 0
      ? "Due today"
      : `In ${days}d`;

  return (
    <div>
      <div className="text-xs text-foreground">{formatDate(inv.due_date)}</div>
      {inv.status === "unpaid" && (
        <div className={`text-[11px] font-semibold ${tone}`}>{text}</div>
      )}
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  hover,
  children,
}: {
  title: string;
  onClick: () => void;
  hover: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-muted-foreground transition ${hover}`}
    >
      {children}
    </button>
  );
}

interface Props {
  invoices: SubscriptionInvoice[];
  onConfirm: (inv: SubscriptionInvoice) => void;
  onEditAmount: (inv: SubscriptionInvoice) => void;
  onResendReceipt: (inv: SubscriptionInvoice) => void;
  emailingId: string | null;
  onDelete: (id: string) => void;
}

export function InvoicesTable({
  invoices,
  onConfirm,
  onEditAmount,
  onResendReceipt,
  emailingId,
  onDelete,
}: Props) {
  const router = useRouter();
  const th =
    "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-muted">
          <tr>
            <th className={th}>Invoice</th>
            <th className={th}>Store</th>
            <th className={th}>Plan</th>
            <th className={th}>Period</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={th}>Due</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const needsAction = inv.status === "submitted";
            const canConfirm = inv.status === "unpaid" || inv.status === "submitted";

            return (
              <tr
                key={inv.id}
                className={`border-t border-border align-top transition-colors hover:bg-accent/50 ${
                  needsAction ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                } ${isOverdue(inv) ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}
              >
                <td className="px-4 py-4">
                  <button
                    onClick={() => router.push(`/dashboard/subscription/invoices/${inv.id}`)}
                    className="font-mono font-bold text-violet-700 dark:text-violet-400 hover:underline text-left"
                  >
                    {inv.invoice_number}
                  </button>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(inv.created_at)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="font-semibold text-foreground truncate max-w-52">
                    {inv.stores?.store_name ?? "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-52">
                    {inv.stores?.owner?.email ?? ""}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{inv.plan_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {BILLING_CYCLE_LABELS[inv.billing_cycle]}
                  </div>
                </td>

                <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(inv.period_start)}
                  <br />→ {formatDate(inv.period_end)}
                </td>

                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <div className="font-extrabold text-foreground">
                    ৳{inv.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{inv.currency}</div>
                </td>

                <td className="px-4 py-4">
                  <DueCell inv={inv} />
                </td>

                <td className="px-4 py-4">
                  <StatusBadge status={inv.status} />
                  {inv.status === "paid" && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(inv.paid_at)}
                      {inv.payment_method && (
                        <span className="capitalize"> · {inv.payment_method}</span>
                      )}
                    </div>
                  )}
                  {needsAction && (
                    <div className="mt-1 text-[11px] leading-snug">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        Awaiting your confirmation
                      </div>
                      {inv.payment_reference && (
                        <div className="font-mono text-violet-700 dark:text-violet-400">
                          Ref: {inv.payment_reference}
                        </div>
                      )}
                      {inv.sender_number && (
                        <div className="font-mono text-muted-foreground">
                          {inv.payment_method && (
                            <span className="capitalize">{inv.payment_method}: </span>
                          )}
                          {inv.sender_number}
                        </div>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <ActionButton
                      title="View invoice"
                      onClick={() => router.push(`/dashboard/subscription/invoices/${inv.id}`)}
                      hover="hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                    >
                      <Eye className="w-4 h-4" />
                    </ActionButton>
                    {canConfirm && (
                      <ActionButton
                        title={needsAction ? "Confirm payment" : "Mark as paid"}
                        onClick={() => onConfirm(inv)}
                        hover="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </ActionButton>
                    )}
                    {inv.status === "paid" && (
                      <ActionButton
                        title={emailingId === inv.id ? "Sending…" : "Email receipt to store owner"}
                        onClick={() => emailingId === null && onResendReceipt(inv)}
                        hover="hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10"
                      >
                        <Mail className={`w-4 h-4 ${emailingId === inv.id ? "animate-pulse" : ""}`} />
                      </ActionButton>
                    )}
                    <ActionButton
                      title="Edit amount"
                      onClick={() => onEditAmount(inv)}
                      hover="hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </ActionButton>
                    <ActionButton
                      title="Delete"
                      onClick={() => onDelete(inv.id)}
                      hover="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
