"use client";

import { Fragment, useState } from "react";
import { Select } from "antd";
import {
  ChevronRight,
  Eye,
  MessageCircle,
  Pencil,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BILLING_CYCLE_LABELS,
  BillingCycle,
  StoreSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/types/subscription.types";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
} from "@/lib/types/invoice.types";
import { calcCycleAmount, monthsBetween } from "@/lib/utils/billingCycle";
import { getPendingPlanSwitch } from "@/lib/utils/planSwitch";
import {
  buildRenewalReminder,
  toWhatsAppNumber,
  whatsAppLink,
} from "@/lib/utils/whatsapp";

type Invoice = NonNullable<StoreSubscription["subscription_invoices"]>[number];

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(amount: number, currency = "BDT") {
  const symbol = currency === "BDT" ? "৳" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

// Older rows still use the single-L "canceled" spelling.
function normalizeInvoiceStatus(status: string): InvoiceStatus {
  if (status === "canceled") return "cancelled";
  return (status in INVOICE_STATUS_COLORS ? status : "unpaid") as InvoiceStatus;
}

function sameDay(a?: string | null, b?: string | null) {
  if (!a || !b) return a === b;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function summarizeBilling(invoices: Invoice[]) {
  let paidCount = 0;
  let paidTotal = 0;
  let currency = "BDT";
  let pending: Invoice | undefined;

  for (const inv of invoices) {
    const status = normalizeInvoiceStatus(inv.status);
    currency = inv.currency || currency;
    if (status === "paid") {
      paidCount += 1;
      paidTotal += Number(inv.amount) || 0;
    }
    // invoices are newest-first, so the first open one is the current one
    if (!pending && (status === "unpaid" || status === "submitted")) {
      pending = inv;
    }
  }
  return { paidCount, paidTotal, currency, pending, total: invoices.length };
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const c = SUBSCRIPTION_STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </span>
  );
}

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const c = INVOICE_STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

/** Progress through the current billing period, plus a human "time left". */
function PeriodCell({ sub }: { sub: StoreSubscription }) {
  const start = new Date(sub.current_period_start).getTime();
  const end = sub.current_period_end
    ? new Date(sub.current_period_end).getTime()
    : null;

  if (!end) {
    return (
      <div className="text-xs text-muted-foreground">
        {formatDate(sub.current_period_start)} → no end date
      </div>
    );
  }

  const now = Date.now();
  const total = Math.max(end - start, 1);
  const pct = Math.min(Math.max(((now - start) / total) * 100, 0), 100);
  const daysLeft = Math.ceil((end - now) / DAY_MS);

  const expired = daysLeft < 0;
  const soon = !expired && daysLeft <= 7;
  const label = expired
    ? `Ended ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0
      ? "Ends today"
      : `${daysLeft}d left`;
  const tone = expired
    ? "text-red-600 dark:text-red-400"
    : soon
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";
  const bar = expired ? "bg-red-500" : soon ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="min-w-40">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-foreground">
          {formatDate(sub.current_period_start)} → {formatDate(sub.current_period_end)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`mt-1 text-[11px] font-semibold ${tone}`}>{label}</div>
    </div>
  );
}

function BillingCell({ invoices }: { invoices: Invoice[] }) {
  const { paidCount, paidTotal, currency, pending, total } =
    summarizeBilling(invoices);

  if (total === 0) {
    return <span className="text-xs text-muted-foreground">No invoices yet</span>;
  }

  return (
    <div>
      <div className="text-sm font-bold text-foreground">
        {paidCount} paid
        <span className="font-normal text-muted-foreground"> of {total}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {money(paidTotal, currency)} collected
        {paidCount > 1 && ` · ${paidCount - 1} renewal${paidCount - 1 > 1 ? "s" : ""}`}
      </div>
      {pending && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400">
          {pending.invoice_number} · {INVOICE_STATUS_LABELS[normalizeInvoiceStatus(pending.status)]}
        </div>
      )}
    </div>
  );
}

function IconButton({
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-xs font-medium text-foreground">{value}</div>
    </div>
  );
}

function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();

  if (invoices.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No invoices have been generated for this subscription.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground bg-muted">
            <th className="px-3 py-2 font-bold">#</th>
            <th className="px-3 py-2 font-bold">Invoice</th>
            <th className="px-3 py-2 font-bold">Plan / Cycle</th>
            <th className="px-3 py-2 font-bold">Period</th>
            <th className="px-3 py-2 font-bold text-right">Amount</th>
            <th className="px-3 py-2 font-bold">Status</th>
            <th className="px-3 py-2 font-bold">Paid on</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr key={inv.id} className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground">
                {invoices.length - i}
              </td>
              <td className="px-3 py-2 font-mono font-bold text-foreground">
                {inv.invoice_number}
              </td>
              <td className="px-3 py-2 text-foreground">
                {inv.plan_name}
                <span className="text-muted-foreground">
                  {" "}· {BILLING_CYCLE_LABELS[inv.billing_cycle] ?? inv.billing_cycle}
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
              </td>
              <td className="px-3 py-2 text-right font-bold text-foreground">
                {money(Number(inv.amount) || 0, inv.currency)}
              </td>
              <td className="px-3 py-2">
                <InvoiceBadge status={normalizeInvoiceStatus(inv.status)} />
              </td>
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                {formatDate(inv.paid_at)}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  title="View invoice"
                  aria-label="View invoice"
                  onClick={() =>
                    router.push(`/dashboard/subscription/invoices/${inv.id}`)
                  }
                  className="p-1 rounded text-muted-foreground hover:text-violet-600 hover:bg-accent transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  subs: StoreSubscription[];
  plans: SubscriptionPlan[];
  onEdit: (sub: StoreSubscription) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onStatusChange: (id: string, status: SubscriptionStatus) => void;
  onRenew: (sub: StoreSubscription) => void;
  onSyncInvoiceDates: (sub: StoreSubscription, invoiceId: string) => void;
}

export function StoreSubscriptionsTable({
  subs,
  plans,
  onEdit,
  onDelete,
  onCancel,
  onStatusChange,
  onRenew,
  onSyncInvoiceDates,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const router = useRouter();

  const th = "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="w-10 px-2" />
            <th className={th}>Store</th>
            <th className={th}>Plan</th>
            <th className={th}>Status</th>
            <th className={th}>Current period</th>
            <th className={th}>Billing history</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((sub) => {
            const store = sub.stores;
            const plan = sub.subscription_plans;
            const owner = store?.owner;
            const invoices = sub.subscription_invoices ?? [];
            const open = openId === sub.id;

            const customMonths =
              sub.billing_cycle === BillingCycle.CUSTOM && sub.current_period_end
                ? monthsBetween(
                    new Date(sub.current_period_start),
                    new Date(sub.current_period_end),
                  )
                : undefined;
            // What the current period *should* cost from the plan's price list...
            const expectedAmount = plan
              ? calcCycleAmount(plan as SubscriptionPlan, sub.billing_cycle, customMonths)
              : null;
            // ...versus what was actually billed. The invoice that covers the
            // *current* period is the newest paid one (or the only live one for
            // a brand-new subscription). A pending renewal invoice has future
            // dates by design, so it must not be compared against the period.
            const liveInvoices = invoices.filter((inv) => {
              const st = normalizeInvoiceStatus(inv.status);
              return st !== "cancelled" && st !== "refunded";
            });
            const coveringInvoice =
              invoices.find((inv) => normalizeInvoiceStatus(inv.status) === "paid") ??
              (liveInvoices.length === 1 ? liveInvoices[0] : undefined);
            const billedAmount = coveringInvoice ? Number(coveringInvoice.amount) || 0 : null;
            const amount =
              billedAmount ?? (liveInvoices[0] ? Number(liveInvoices[0].amount) || 0 : expectedAmount);
            const mismatch =
              billedAmount !== null &&
              expectedAmount !== null &&
              billedAmount !== expectedAmount;
            const datesMismatch =
              !!coveringInvoice &&
              (!sameDay(coveringInvoice.period_start, sub.current_period_start) ||
                (!!sub.current_period_end &&
                  !sameDay(coveringInvoice.period_end, sub.current_period_end)));

            // WhatsApp renewal reminder: opens a pre-written chat with the owner.
            const waNumber = toWhatsAppNumber(owner?.phone);
            const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
            const daysToEnd = periodEnd
              ? Math.ceil((periodEnd.getTime() - Date.now()) / DAY_MS)
              : null;
            const reminderDue = daysToEnd !== null && daysToEnd <= 7;
            const isCustomCycle = sub.billing_cycle === BillingCycle.CUSTOM;
            // Renewal price = the plan they're already on, for their billing
            // cycle - not the last paid or invoiced amount.
            const planPrice = plan
              ? calcCycleAmount(plan as SubscriptionPlan, sub.billing_cycle)
              : 0;
            // Other fixed durations of the same plan, offered as a switch option.
            const otherCycles = plan
              ? [BillingCycle.MONTHLY, BillingCycle.HALF_YEARLY, BillingCycle.YEARLY]
                  .filter((c) => c !== sub.billing_cycle)
                  .map((c) => ({
                    label: BILLING_CYCLE_LABELS[c],
                    amount: calcCycleAmount(plan as SubscriptionPlan, c),
                  }))
                  .filter((c) => c.amount > 0)
              : [];
            // A trial/free plan has nothing to renew - the owner must pick a paid plan.
            const fullPlan = plans.find((p) => p.id === sub.plan_id);
            const isTrialPlan =
              sub.status === SubscriptionStatus.TRIALING ||
              !!fullPlan?.is_default_trial_plan ||
              (!!plan && plan.price_monthly === 0);
            const sendReminder = () => {
              if (!waNumber || !periodEnd) return;
              const message = buildRenewalReminder({
                ownerFirstName: owner?.first_name,
                storeName: store?.store_name ?? "your store",
                planName: plan?.name ?? "current",
                periodEnd,
                cycleLabel: BILLING_CYCLE_LABELS[sub.billing_cycle],
                amount: planPrice,
                isCustom: isCustomCycle,
                customMonths,
                isTrial: isTrialPlan,
                otherCycles,
              });
              window.open(whatsAppLink(waNumber, message), "_blank", "noopener,noreferrer");
            };
            const waTitle = !periodEnd
              ? "No period end date to remind about"
              : !waNumber
                ? "Owner has no valid phone number"
                : reminderDue
                  ? daysToEnd! < 0
                    ? "Send WhatsApp reminder (subscription ended)"
                    : "Send WhatsApp reminder (ending soon)"
                  : "Send WhatsApp reminder";

            const pendingSwitch = getPendingPlanSwitch(sub.metadata);
            const pendingPlanName = pendingSwitch
              ? plans.find((p) => p.id === pendingSwitch.pending_plan_id)?.name
              : null;

            return (
              <Fragment key={sub.id}>
                <tr
                  className={`border-t border-border align-top cursor-pointer transition-colors hover:bg-accent/50 ${open ? "bg-accent/40" : ""}`}
                  onClick={() => setOpenId(open ? null : sub.id)}
                >
                  <td className="px-2 py-4 text-muted-foreground">
                    <ChevronRight
                      className={`w-4 h-4 mx-auto transition-transform ${open ? "rotate-90" : ""}`}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 min-w-48">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                        {store?.store_name?.slice(0, 2).toUpperCase() ?? "??"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">
                          {store?.store_name ?? "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {owner
                            ? `${owner.first_name} ${owner.last_name}`
                            : sub.user_id}
                        </div>
                        {owner && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {owner.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-bold text-foreground">{plan?.name ?? "—"}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {amount !== null && (
                        <span className="font-bold text-violet-600 dark:text-violet-400">
                          {money(amount)}
                        </span>
                      )}{" "}
                      / {BILLING_CYCLE_LABELS[sub.billing_cycle]}
                    </div>
                    {mismatch && expectedAmount !== null && (
                      <div
                        className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 max-w-44"
                        title="The current period length doesn't match what the latest invoice charged. The period may have been changed after the invoice was created."
                      >
                        ⚠ Period is worth {money(expectedAmount)} — billed {money(billedAmount ?? 0)}
                        {coveringInvoice && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/subscription/invoices?search=${encodeURIComponent(coveringInvoice.invoice_number)}`,
                              );
                            }}
                            className="ml-1 underline hover:opacity-80"
                          >
                            Fix invoice
                          </button>
                        )}
                      </div>
                    )}
                    {datesMismatch && coveringInvoice && (
                      <div
                        className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 max-w-44"
                        title="The invoice's billing period differs from the subscription's current period."
                      >
                        ⚠ Invoice period {formatDate(coveringInvoice.period_start)} → {formatDate(coveringInvoice.period_end)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSyncInvoiceDates(sub, coveringInvoice.id);
                          }}
                          className="ml-1 underline hover:opacity-80"
                        >
                          Sync invoice dates
                        </button>
                      </div>
                    )}
                    {pendingSwitch && (
                      <div className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        → {pendingPlanName ?? "plan"} on{" "}
                        {formatDate(pendingSwitch.pending_plan_effective_at)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={sub.status} />
                    {sub.cancels_at_period_end && (
                      <div className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Cancels at period end
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <PeriodCell sub={sub} />
                  </td>

                  <td className="px-4 py-4">
                    <BillingCell invoices={invoices} />
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton
                        title={waTitle}
                        onClick={sendReminder}
                        hover={
                          !waNumber || !periodEnd
                            ? "opacity-40 cursor-not-allowed"
                            : reminderDue
                              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        }
                      >
                        <MessageCircle className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        title="Renew subscription"
                        onClick={() => onRenew(sub)}
                        hover="hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        title="Edit"
                        onClick={() => onEdit(sub)}
                        hover="hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        title="Cancel subscription"
                        onClick={() => onCancel(sub.id)}
                        hover="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        title="Delete"
                        onClick={() => onDelete(sub.id)}
                        hover="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>

                {open && (
                  <tr className="border-t border-border bg-muted/40">
                    <td colSpan={7} className="px-6 py-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <Detail label="Started" value={formatDate(sub.started_at)} />
                        <Detail label="Expires" value={formatDate(sub.expires_at)} />
                        <Detail label="Trial ends" value={formatDate(sub.trial_ends_at)} />
                        <Detail label="Canceled at" value={formatDate(sub.canceled_at)} />
                        <Detail label="Plan slug" value={plan?.slug ?? "—"} />
                        <Detail label="Payment provider" value={sub.payment_provider ?? "—"} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                            Quick status
                          </div>
                          <Select
                            size="small"
                            value={sub.status}
                            onChange={(v) => onStatusChange(sub.id, v as SubscriptionStatus)}
                            className="w-32"
                            options={Object.values(SubscriptionStatus).map((s) => ({
                              value: s,
                              label: SUBSCRIPTION_STATUS_LABELS[s],
                            }))}
                          />
                        </div>
                      </div>

                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Billing history ({invoices.length})
                      </div>
                      <InvoiceHistory invoices={invoices} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
