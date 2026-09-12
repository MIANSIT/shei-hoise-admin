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
  halfYearlySavingsPct,
  effectiveHalfYearlyPrice,
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
  const defaultTrialPlan = plans.find((p) => p.is_default_trial_plan);
  const trialDays = defaultTrialPlan?.trial_days || Math.max(0, ...comparable.map((p) => p.trial_days));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 print:bg-white">
      <div className="max-w-[1000px] mx-auto px-6 py-10 print:px-0 print:py-0 print:max-w-none">
        {/* Header — one banner for both screen and print, so what you see is what prints */}
        <div className="rounded-2xl print:rounded-none bg-gradient-to-br from-violet-700 via-violet-600 to-purple-600 px-7 py-7 sm:px-8 sm:py-8 mb-8 print:mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold text-violet-200 uppercase tracking-[0.2em] mb-2">
              Merchant Plan Overview
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{pd.company.name}</h1>
            <p className="text-sm text-violet-100 mt-1.5 max-w-sm">
              What a store owner gets on Shei Hoise — always current, share or print this page directly.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold border border-white/20 transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>

        {/* Trial banner — overlaps the header bottom edge */}
        {trialDays > 0 && (
          <div className="relative -mt-4 mb-8 print:-mt-3 print:mb-6 bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-500/20 rounded-2xl shadow-lg shadow-violet-500/10 print:shadow-none print:border-slate-300 px-6 py-4 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-slate-100">Every new store starts free.</span>{" "}
              Get full access for {trialDays} days — no plan required upfront. Pick one below whenever you&apos;re ready.
            </p>
          </div>
        )}

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
                            className={`px-4 pt-4 pb-3 text-center align-bottom border-b-2 ${p.is_featured ? "border-violet-500 bg-gradient-to-b from-violet-50 to-transparent dark:from-violet-500/10" : "border-slate-200 dark:border-white/10"}`}
                          >
                            <div className="h-5 flex items-center justify-center mb-1">
                              {p.is_featured && (
                                <span className="inline-block text-[9px] font-extrabold text-white bg-violet-600 uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                  Most Popular
                                </span>
                              )}
                            </div>
                            <div className={`text-base font-bold ${p.is_featured ? "text-violet-700 dark:text-violet-400" : "text-slate-800 dark:text-slate-100"}`}>
                              {p.name}
                            </div>
                            {p.trial_days > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{p.trial_days}-day trial</div>
                            )}
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
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">Half Yearly</td>
                        {comparable.map((p) => {
                          const price = effectiveHalfYearlyPrice(p);
                          const pct = halfYearlySavingsPct(p.price_monthly, price);
                          return (
                            <td key={p.id} className={`px-4 py-2.5 text-center ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(price, p.currency)}</div>
                              {pct > 0 && (
                                <span className="inline-block mt-1 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 rounded-full px-2 py-0.5">
                                  save {pct}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">Yearly</td>
                        {comparable.map((p) => {
                          const pct = yearlySavingsPct(p.price_monthly, p.price_yearly);
                          return (
                            <td key={p.id} className={`px-4 py-2.5 text-center ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(p.price_yearly, p.currency)}</div>
                              {pct > 0 && (
                                <span className="inline-block mt-1 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 rounded-full px-2 py-0.5">
                                  save {pct}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05]">
                        <td colSpan={comparable.length + 1} className="px-4 py-3">
                          <div className="text-center text-xs text-violet-700 dark:text-violet-300 bg-violet-50/70 dark:bg-violet-500/[0.07] border border-dashed border-violet-200 dark:border-violet-500/30 rounded-lg px-4 py-2">
                            Need a custom-length term (2, 4, 5 months...)? Contact us — {pd.company.phone} · {pd.company.email}
                          </div>
                        </td>
                      </tr>

                      {limitKeys.length > 0 && (
                        <tr>
                          <td colSpan={comparable.length + 1} className="px-4 pt-4 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1 h-3 rounded-sm bg-violet-400" />
                              <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Capacity</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {limitKeys.map((k, idx) => (
                        <tr key={k} className={`border-b border-slate-100 dark:border-white/[0.05] ${idx % 2 === 1 ? "bg-slate-50/60 dark:bg-white/[0.015]" : ""}`}>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{limitLabel(k)}</td>
                          {comparable.map((p) => {
                            const v = p.limits[k];
                            const label = v === undefined ? "—" : Number(v) === -1 ? "Unlimited" : Number(v).toLocaleString();
                            return (
                              <td key={p.id} className={`px-4 py-2 text-center font-medium text-slate-700 dark:text-slate-200 ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}>
                                {label}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {featureKeys.length > 0 && (
                        <tr>
                          <td colSpan={comparable.length + 1} className="px-4 pt-4 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1 h-3 rounded-sm bg-violet-400" />
                              <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Features</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {featureKeys.map((k, idx) => (
                        <tr key={k} className={`border-b border-slate-100 dark:border-white/[0.05] last:border-0 ${idx % 2 === 1 ? "bg-slate-50/60 dark:bg-white/[0.015]" : ""}`}>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{featureLabel(k)}</td>
                          {comparable.map((p) => (
                            <td
                              key={p.id}
                              className={`px-4 py-2 text-center ${p.is_featured ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}
                            >
                              {p.features[k] ? (
                                <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 items-center justify-center text-[11px] font-bold">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">—</span>
                              )}
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

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.07] text-center print:break-inside-avoid">
              <div className="h-[3px] w-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 mx-auto mb-3.5" />
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{pd.company.name} — Merchant Plan Overview</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {pd.company.phone} · {pd.company.email} · {pd.company.website.replace(/^https?:\/\//, "")}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
