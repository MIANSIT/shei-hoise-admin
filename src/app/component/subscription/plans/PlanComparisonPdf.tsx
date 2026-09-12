"use client";

import { useRef, useState } from "react";
import { Loader2, LayoutGrid } from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
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

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "BDT" ? "৳" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Builds the comparison table PDF straight from whatever public/active plans
 * exist right now — add a plan, toggle a feature, change a price in the
 * plan editor, and the next download reflects it. Nothing here is hardcoded
 * to specific plan names or feature keys.
 */
export function PlanComparisonPdfButton({ plans }: { plans: SubscriptionPlan[] }) {
  const { success, error: notifyError } = useSheiNotification();
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const pd = PAYMENT_DETAILS;

  const comparable = getComparablePlans(plans);
  const featureKeys = getComparisonFeatureKeys(comparable);
  const limitKeys = getComparisonLimitKeys(comparable);
  const defaultTrialPlan = plans.find((p) => p.is_default_trial_plan);
  const trialDays = defaultTrialPlan?.trial_days || Math.max(0, ...comparable.map((p) => p.trial_days));
  const colWidth = comparable.length > 0 ? `${72 / comparable.length}%` : "auto";
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const downloadPDF = async () => {
    if (!pdfRef.current || comparable.length === 0) return;
    setGenerating(true);
    const el = pdfRef.current;
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      el.style.cssText =
        "display:block;position:fixed;top:0;left:0;width:794px;z-index:10000;background:#fff;";
      await new Promise((r) => setTimeout(r, 200));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        height: el.scrollHeight,
        windowHeight: el.scrollHeight,
      });

      el.style.cssText = "display:none;";

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgH = (canvas.height / canvas.width) * pdfW;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, imgH);

      pdf.save("shei-hoise-plan-comparison.pdf");
      success("Comparison PDF downloaded!");
    } catch (err) {
      console.error("Comparison PDF error:", err);
      el.style.cssText = "display:none;";
      notifyError("Failed to generate PDF. Please try again.");
    }
    setGenerating(false);
  };

  return (
    <>
      <button
        onClick={downloadPDF}
        disabled={generating || comparable.length === 0}
        title={
          comparable.length === 0
            ? "Mark at least one plan Active + Public to compare it"
            : "Download a PDF comparing every active, public plan"
        }
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/40 disabled:opacity-50 text-slate-700 dark:text-slate-200 hover:text-violet-700 dark:hover:text-violet-400 text-sm font-semibold transition"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
        Compare Plans PDF
      </button>

      {/* Hidden document captured by html2canvas — rebuilt from live plan data every click */}
      <div
        ref={pdfRef}
        style={{
          display: "none",
          width: 794,
          backgroundColor: "#fff",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #9333ea 100%)", padding: "38px 44px 46px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#ddd8fe", textTransform: "uppercase", letterSpacing: 2.5 }}>
                Pricing &amp; Plans
              </div>
              <div style={{ fontSize: 25, fontWeight: 800, color: "#fff", letterSpacing: -0.3, marginTop: 6 }}>
                {pd.company.name}
              </div>
              <div style={{ fontSize: 12.5, color: "#ede9fe", marginTop: 4 }}>Choose the plan that fits your store</div>
            </div>
            <div style={{ fontSize: 10, color: "#ddd8fe", whiteSpace: "nowrap" }}>{today}</div>
          </div>
        </div>

        <div style={{ padding: "0 44px 36px" }}>
          {/* Trial banner — overlaps the header bottom edge */}
          {trialDays > 0 && (
            <div
              style={{
                marginTop: -22,
                marginBottom: 26,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #ece7fd",
                boxShadow: "0 6px 18px rgba(109,40,217,0.12)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 13,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>Every new store starts free.</span>{" "}
                Get full access for {trialDays} days — no plan required upfront. Pick one below whenever you&apos;re ready.
              </div>
            </div>
          )}

          {comparable.length === 0 ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>No active, public plans to compare.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: comparable.length > 4 ? 10.5 : 12 }}>
              <thead>
                <tr>
                  <th style={{ width: "26%" }} />
                  {comparable.map((p) => (
                    <th
                      key={p.id}
                      style={{
                        width: colWidth,
                        padding: "0 8px 14px",
                        textAlign: "center",
                        verticalAlign: "bottom",
                        borderBottom: `2px solid ${p.is_featured ? "#7c3aed" : "#e2e8f0"}`,
                      }}
                    >
                      <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {p.is_featured && (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 8.5,
                              fontWeight: 800,
                              color: "#fff",
                              background: "#7c3aed",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              padding: "3px 10px",
                              borderRadius: 20,
                            }}
                          >
                            Most Popular
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: p.is_featured ? "#6d28d9" : "#0f172a", marginTop: 4 }}>
                        {p.name}
                      </div>
                      {p.trial_days > 0 && (
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{p.trial_days}-day trial</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Monthly</td>
                  {comparable.map((p) => (
                    <td key={p.id} style={{ textAlign: "center", padding: "12px 8px", fontWeight: 800, fontSize: 13, borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#faf9ff" : "transparent" }}>
                      {formatMoney(p.price_monthly, p.currency)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Half Yearly</td>
                  {comparable.map((p) => {
                    const price = effectiveHalfYearlyPrice(p);
                    const pct = halfYearlySavingsPct(p.price_monthly, price);
                    return (
                      <td key={p.id} style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#faf9ff" : "transparent" }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{formatMoney(price, p.currency)}</div>
                        {pct > 0 && (
                          <span style={{ display: "inline-block", marginTop: 3, fontSize: 9, fontWeight: 700, color: "#92700e", background: "#fef3c7", borderRadius: 8, padding: "1px 7px" }}>
                            save {pct}%
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ padding: "12px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Yearly</td>
                  {comparable.map((p) => {
                    const pct = yearlySavingsPct(p.price_monthly, p.price_yearly);
                    return (
                      <td key={p.id} style={{ textAlign: "center", padding: "12px 8px", borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#faf9ff" : "transparent" }}>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{formatMoney(p.price_yearly, p.currency)}</div>
                        {pct > 0 && (
                          <span style={{ display: "inline-block", marginTop: 3, fontSize: 9, fontWeight: 700, color: "#92700e", background: "#fef3c7", borderRadius: 8, padding: "1px 7px" }}>
                            save {pct}%
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td colSpan={comparable.length + 1} style={{ padding: "14px 8px 4px" }}>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 10.5,
                        color: "#7c5cd6",
                        background: "#f8f6fe",
                        border: "1px dashed #ddd4fb",
                        borderRadius: 8,
                        padding: "9px 14px",
                      }}
                    >
                      Need a custom-length term (2, 4, 5 months...)? Contact us — {pd.company.phone} · {pd.company.email}
                    </div>
                  </td>
                </tr>

                {limitKeys.length > 0 && (
                  <tr>
                    <td colSpan={comparable.length + 1} style={{ padding: "18px 8px 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 4, height: 12, borderRadius: 2, background: "#a78bfa", display: "inline-block" }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1.2 }}>Capacity</span>
                      </div>
                    </td>
                  </tr>
                )}
                {limitKeys.map((k, idx) => (
                  <tr key={k} style={{ backgroundColor: idx % 2 === 1 ? "#fafafa" : "transparent" }}>
                    <td style={{ padding: "9px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{limitLabel(k)}</td>
                    {comparable.map((p) => {
                      const v = p.limits[k];
                      const label = v === undefined ? "—" : Number(v) === -1 ? "Unlimited" : Number(v).toLocaleString();
                      return (
                        <td key={p.id} style={{ textAlign: "center", padding: "9px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, backgroundColor: p.is_featured ? "#faf9ff" : "transparent" }}>
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {featureKeys.length > 0 && (
                  <tr>
                    <td colSpan={comparable.length + 1} style={{ padding: "18px 8px 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 4, height: 12, borderRadius: 2, background: "#a78bfa", display: "inline-block" }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1.2 }}>Features</span>
                      </div>
                    </td>
                  </tr>
                )}
                {featureKeys.map((k, idx) => (
                  <tr key={k} style={{ backgroundColor: idx % 2 === 1 ? "#fafafa" : "transparent" }}>
                    <td style={{ padding: "9px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{featureLabel(k)}</td>
                    {comparable.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          textAlign: "center",
                          padding: "9px 8px",
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: p.is_featured ? "#faf9ff" : "transparent",
                        }}
                      >
                        {p.features[k] ? (
                          <span
                            style={{
                              display: "inline-flex",
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#dcfce7",
                              color: "#16a34a",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          <div style={{ marginTop: 30, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ height: 3, width: 56, borderRadius: 2, background: "linear-gradient(90deg, #6d28d9, #a855f7)", margin: "0 auto 14px" }} />
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#334155" }}>{pd.company.name}</div>
            <div style={{ textAlign: "center", fontSize: 10.5, color: "#94a3b8", marginTop: 3 }}>
              {pd.company.phone} · {pd.company.email} · {pd.company.website.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
