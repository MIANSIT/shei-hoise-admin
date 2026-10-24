"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  StoreSubscription,
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/types/subscription.types";

type SortKey = "spent" | "payments" | "last" | "name";

interface StoreSpend {
  storeId: string;
  name: string;
  owner: string;
  email: string;
  planName: string;
  status: StoreSubscription["status"];
  payments: number;
  spent: number;
  pending: number;
  firstPaid: number | null;
  lastPaid: number | null;
}

function formatDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(n: number) {
  return `৳${n.toLocaleString()}`;
}

// Invoices still use the single-L "canceled" spelling on older rows.
function isClosed(status: string) {
  return status === "cancelled" || status === "canceled" || status === "refunded";
}

/** One row per store, summed across every subscription the store has had. */
function aggregate(subs: StoreSubscription[]): StoreSpend[] {
  const byStore = new Map<string, StoreSpend>();

  for (const sub of subs) {
    const key = sub.store_id;
    let row = byStore.get(key);
    if (!row) {
      const owner = sub.stores?.owner;
      row = {
        storeId: key,
        name: sub.stores?.store_name ?? "—",
        owner: owner ? `${owner.first_name} ${owner.last_name}` : "",
        email: owner?.email ?? "",
        planName: sub.subscription_plans?.name ?? "—",
        status: sub.status,
        payments: 0,
        spent: 0,
        pending: 0,
        firstPaid: null,
        lastPaid: null,
      };
      byStore.set(key, row);
    }

    for (const inv of sub.subscription_invoices ?? []) {
      const amount = Number(inv.amount) || 0;
      if (inv.status === "paid") {
        row.payments += 1;
        row.spent += amount;
        const when = new Date(inv.paid_at ?? inv.created_at).getTime();
        row.firstPaid = row.firstPaid === null ? when : Math.min(row.firstPaid, when);
        row.lastPaid = row.lastPaid === null ? when : Math.max(row.lastPaid, when);
      } else if (!isClosed(inv.status)) {
        row.pending += amount;
      }
    }
  }

  return [...byStore.values()];
}

export function StoreSpendTable({ subs }: { subs: StoreSubscription[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("spent");
  const [desc, setDesc] = useState(true);

  const rows = useMemo(() => {
    const list = aggregate(subs);
    const dir = desc ? -1 : 1;
    list.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "payments":
          return (a.payments - b.payments) * dir;
        case "last":
          return ((a.lastPaid ?? 0) - (b.lastPaid ?? 0)) * dir;
        default:
          return (a.spent - b.spent) * dir;
      }
    });
    return list;
  }, [subs, sortKey, desc]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (t, r) => ({
          spent: t.spent + r.spent,
          payments: t.payments + r.payments,
          pending: t.pending + r.pending,
        }),
        { spent: 0, payments: 0, pending: 0 },
      ),
    [rows],
  );

  const toggle = (key: SortKey) => {
    if (key === sortKey) setDesc(!desc);
    else {
      setSortKey(key);
      setDesc(key !== "name");
    }
  };

  const th =
    "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

  const SortHead = ({
    label,
    k,
    right,
  }: {
    label: string;
    k: SortKey;
    right?: boolean;
  }) => (
    <th className={`${th} ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground transition ${
          sortKey === k ? "text-foreground" : ""
        }`}
      >
        {label}
        {sortKey === k &&
          (desc ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </button>
    </th>
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted">
          <tr>
            <th className={`${th} w-12 text-left`}>#</th>
            <SortHead label="Store" k="name" />
            <th className={`${th} text-left`}>Current plan</th>
            <SortHead label="Payments" k="payments" right />
            <SortHead label="Total spent" k="spent" right />
            <th className={`${th} text-right`}>Avg / payment</th>
            <th className={`${th} text-right`}>Unpaid</th>
            <SortHead label="Last paid" k="last" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const c = SUBSCRIPTION_STATUS_COLORS[r.status];
            return (
              <tr key={r.storeId} className="border-t border-border hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-foreground">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.owner}
                    {r.email && ` · ${r.email}`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{r.planName}</div>
                  <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {SUBSCRIPTION_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                  {r.payments}
                </td>
                <td className="px-4 py-3 text-right font-extrabold text-violet-700 dark:text-violet-400 tabular-nums">
                  {money(r.spent)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                  {r.payments ? money(Math.round(r.spent / r.payments)) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.pending > 0 ? (
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {money(r.pending)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(r.lastPaid)}
                  {r.firstPaid && r.firstPaid !== r.lastPaid && (
                    <div className="text-[10px]">since {formatDate(r.firstPaid)}</div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted font-bold">
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-foreground">{rows.length} stores</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums text-foreground">{totals.payments}</td>
            <td className="px-4 py-3 text-right tabular-nums text-violet-700 dark:text-violet-400">
              {money(totals.spent)}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums text-orange-600 dark:text-orange-400">
              {totals.pending > 0 ? money(totals.pending) : "—"}
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
