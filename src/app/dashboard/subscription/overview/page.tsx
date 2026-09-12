"use client";

import { useEffect, useState } from "react";
import { Printer, CheckCircle2, Loader2 } from "lucide-react";
import { getSubscriptionPlans } from "@/lib/queries/subscription/plans/getPlans";
import { SubscriptionPlan } from "@/lib/types/subscription.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";
import { featureLabel, limitLabel } from "@/lib/constants/planFeaturePresets";
import {
  getComparablePlans,
  getComparisonFeatureKeys,
  getComparisonLimitKeys,
  yearlySavingsPct,
} from "@/lib/utils/planComparison";

// Baseline platform capabilities — always included, regardless of plan.
// Edit this list here when the product changes; the page (and its PDF) picks
// it up on next load, no separate document to keep in sync.
const STOREFRONT_GROUPS: { title: string; items: string[]; note?: string }[] = [
  {
    title: "Shopping",
    items: [
      "Catalog with categories, variants & bundles",
      "Live search & filtering",
      "Flash sales & scheduled pricing",
      "Bengali & English, light/dark theme",
    ],
  },
  {
    title: "Cart & checkout",
    items: [
      "Guest checkout, no forced signup",
      "Configurable shipping tiers & free-shipping rules",
      "Coupon codes with usage limits",
      "Shareable order-link for Messenger/WhatsApp selling",
      "Order tracking by phone number",
    ],
  },
  {
    title: "Accounts & trust",
    items: [
      "Customer accounts with email verification",
      "Order history & self-serve password reset",
      "Product & store reviews with ratings",
      "Post-delivery review invite links",
    ],
  },
  {
    title: "Marketing reach",
    items: ["Facebook product catalog feed", "Welcome & order emails"],
    note: "Meta Pixel & Conversions API — see plan comparison",
  },
];

const DASHBOARD_GROUPS: { title: string; items: string[]; note?: string }[] = [
  {
    title: "Orders & fulfilment",
    items: [
      "Full order list with status workflow",
      "Manual order creation & editing",
      "Bulk courier shipment creation",
      "Bulk & single invoice / receipt PDFs",
      "WhatsApp order-status links",
      "Cross-store COD risk scoring",
    ],
  },
  {
    title: "Point of sale",
    items: [
      'In-person "Quick Sale" register',
      "Camera barcode / QR scan-to-add",
      "Printable 80mm thermal receipts",
      "Cash drawer & daily reconciliation",
    ],
  },
  {
    title: "Products & inventory",
    items: [
      "Products, categories & bundles",
      "Variant-level pricing, images & stock",
      "Low-stock alerts & stock movement log",
      "Bulk stock updates & Excel import/export",
      "Auto-generated product QR codes",
    ],
  },
  {
    title: "Finance & reporting",
    items: [
      "Sales reports",
      "Revenue, profit & inventory-value dashboard",
      "Customer dues / outstanding balance tracking",
    ],
    note: "Expense tracking — see plan comparison",
  },
  {
    title: "Store setup & branding",
    items: ["Logo, banner & policy pages", "Guided store setup checklist", "Delivery zones & shipping fee tiers"],
    note: "Pathao courier auto-booking — see plan comparison",
  },
];

function GroupCard({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <div className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-5 py-4 print:break-inside-avoid print:border-slate-300">
      <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">{title}</div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
        {note && (
          <li className="flex items-start gap-2 text-[13px] text-amber-600 dark:text-amber-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {note}
          </li>
        )}
      </ul>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "BDT" ? "৳" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

export default function PlanOverviewPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const pd = PAYMENT_DETAILS;

  useEffect(() => {
    (async () => {
      const res = await getSubscriptionPlans();
      if (res.success) setPlans(res.data);
      setLoading(false);
    })();
  }, []);

  const comparable = getComparablePlans(plans);
  const featureKeys = getComparisonFeatureKeys(comparable);
  const limitKeys = getComparisonLimitKeys(comparable);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 print:bg-white">
      <div className="max-w-[1000px] mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none">
        {/* Action bar — hidden when printing */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Merchant Plan Overview
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              What a store owner gets on Shei Hoise — always current, share or print this page directly.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>

        {/* Print-only header */}
        <div className="hidden print:block mb-8 pb-6 border-b border-slate-300">
          <div className="text-2xl font-extrabold text-slate-900">{pd.company.name}</div>
          <div className="text-sm text-slate-500 mt-1">Merchant Plan Overview</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
          </div>
        ) : (
          <>
            <section className="mb-10 print:break-inside-avoid">
              <div className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">01 · The Storefront</div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">What your customers see</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                A branded shopping site at your own store address.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
                {STOREFRONT_GROUPS.map((g) => (
                  <GroupCard key={g.title} {...g} />
                ))}
              </div>
            </section>

            <section className="mb-10">
              <div className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">02 · The Admin Dashboard</div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">What you run the business from</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                One login — front counter to back office, tied to your store.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {DASHBOARD_GROUPS.map((g) => (
                  <GroupCard key={g.title} {...g} />
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                Vendor & supplier management (purchase orders, ledgers, settlements) is available by custom arrangement.
              </p>
            </section>

            <section className="print:break-inside-avoid">
              <div className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">03 · Plans</div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">Which plan gets you what</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Live from Subscription → Plans — reflects whatever is Active + Public right now.
              </p>

              {comparable.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] text-sm text-slate-400">
                  No active, public plans to compare yet.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead style={{ display: "table-header-group" }}>
                      <tr className="border-b border-slate-200 dark:border-white/[0.07]">
                        <th className="text-left px-4 py-3" />
                        {comparable.map((p) => (
                          <th
                            key={p.id}
                            className={`px-4 py-3 text-center ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}
                          >
                            {p.is_featured && (
                              <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">
                                Most popular
                              </div>
                            )}
                            <div className={`text-base font-bold ${p.is_featured ? "text-violet-700 dark:text-violet-400" : "text-slate-800 dark:text-slate-100"}`}>
                              {p.name}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">Monthly</td>
                        {comparable.map((p) => (
                          <td key={p.id} className={`px-4 py-2.5 text-center font-bold text-slate-800 dark:text-slate-100 ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                            {formatMoney(p.price_monthly, p.currency)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">Yearly</td>
                        {comparable.map((p) => {
                          const pct = yearlySavingsPct(p.price_monthly, p.price_yearly);
                          return (
                            <td key={p.id} className={`px-4 py-2.5 text-center ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(p.price_yearly, p.currency)}</div>
                              {pct > 0 && <div className="text-[10px] text-amber-600 dark:text-amber-400">save {pct}%</div>}
                            </td>
                          );
                        })}
                      </tr>

                      {limitKeys.length > 0 && (
                        <tr>
                          <td colSpan={comparable.length + 1} className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-white/[0.02]">
                            Capacity
                          </td>
                        </tr>
                      )}
                      {limitKeys.map((k) => (
                        <tr key={k} className="border-b border-slate-100 dark:border-white/[0.05]">
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{limitLabel(k)}</td>
                          {comparable.map((p) => {
                            const v = p.limits[k];
                            const label = v === undefined ? "—" : Number(v) === -1 ? "Unlimited" : Number(v).toLocaleString();
                            return (
                              <td key={p.id} className={`px-4 py-2 text-center text-slate-700 dark:text-slate-200 ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                                {label}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {featureKeys.length > 0 && (
                        <tr>
                          <td colSpan={comparable.length + 1} className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-white/[0.02]">
                            Features
                          </td>
                        </tr>
                      )}
                      {featureKeys.map((k) => (
                        <tr key={k} className="border-b border-slate-100 dark:border-white/[0.05] last:border-0">
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{featureLabel(k)}</td>
                          {comparable.map((p) => (
                            <td
                              key={p.id}
                              className={`px-4 py-2 text-center font-bold ${p.features[k] ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"} ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}
                            >
                              {p.features[k] ? "✓" : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                Pay by bKash, Nagad or bank transfer. Need something between these plans, or a custom limit? Tailor a plan
                for that business in Subscription → Plans.
              </p>
            </section>

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.07] flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>{pd.company.name} — Merchant Plan Overview</span>
              <span>
                {pd.company.email} · {pd.company.phone}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
