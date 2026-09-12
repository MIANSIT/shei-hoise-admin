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
  const anyTrial = comparable.some((p) => p.trial_days > 0);
  const colWidth = comparable.length > 0 ? `${72 / comparable.length}%` : "auto";

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
        style={{ display: "none", width: 794, backgroundColor: "#fff", fontFamily: "Arial, sans-serif" }}
      >
        <div style={{ background: "linear-gradient(to right, #7c3aed, #9333ea)", padding: "30px 40px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{pd.company.name}</div>
          <div style={{ fontSize: 12, color: "#ddd8fe", marginTop: 2 }}>Plan comparison</div>
          {anyTrial && (
            <div style={{ fontSize: 12, color: "#ede9fe", marginTop: 10 }}>
              Every plan below starts with a free trial before billing begins.
            </div>
          )}
        </div>

        <div style={{ padding: "28px 40px" }}>
          {comparable.length === 0 ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>No active, public plans to compare.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: comparable.length > 4 ? 10.5 : 12 }}>
              <thead>
                <tr>
                  <th style={{ width: "28%" }} />
                  {comparable.map((p) => (
                    <th
                      key={p.id}
                      style={{
                        width: colWidth,
                        padding: "6px 8px 10px",
                        textAlign: "center",
                        borderBottom: "2px solid #e2e8f0",
                        backgroundColor: p.is_featured ? "#f5f3ff" : "transparent",
                      }}
                    >
                      {p.is_featured && (
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
                          Most Popular
                        </div>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 700, color: p.is_featured ? "#6d28d9" : "#0f172a" }}>{p.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Monthly</td>
                  {comparable.map((p) => (
                    <td key={p.id} style={{ textAlign: "center", padding: "10px 8px", fontWeight: 700, borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#f5f3ff" : "transparent" }}>
                      {formatMoney(p.price_monthly, p.currency)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "10px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Half Yearly</td>
                  {comparable.map((p) => {
                    const price = effectiveHalfYearlyPrice(p);
                    const pct = halfYearlySavingsPct(p.price_monthly, price);
                    return (
                      <td key={p.id} style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#f5f3ff" : "transparent" }}>
                        <div style={{ fontWeight: 700 }}>{formatMoney(price, p.currency)}</div>
                        {pct > 0 && <div style={{ fontSize: 9.5, color: "#b8892b" }}>save {pct}%</div>}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ padding: "10px 8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>Yearly</td>
                  {comparable.map((p) => {
                    const pct = yearlySavingsPct(p.price_monthly, p.price_yearly);
                    return (
                      <td key={p.id} style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#f5f3ff" : "transparent" }}>
                        <div style={{ fontWeight: 700 }}>{formatMoney(p.price_yearly, p.currency)}</div>
                        {pct > 0 && <div style={{ fontSize: 9.5, color: "#b8892b" }}>save {pct}%</div>}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td colSpan={comparable.length + 1} style={{ textAlign: "center", padding: "10px 8px", fontStyle: "italic", fontSize: 10.5, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>
                    Need a custom-length term (2, 4, 5 months...)? Contact us — {pd.company.phone} · {pd.company.email}
                  </td>
                </tr>

                {limitKeys.length > 0 && (
                  <tr>
                    <td colSpan={comparable.length + 1} style={{ padding: "10px 8px 4px", fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, backgroundColor: "#f8fafc" }}>
                      Capacity
                    </td>
                  </tr>
                )}
                {limitKeys.map((k) => (
                  <tr key={k}>
                    <td style={{ padding: "8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{limitLabel(k)}</td>
                    {comparable.map((p) => {
                      const v = p.limits[k];
                      const label = v === undefined ? "—" : Number(v) === -1 ? "Unlimited" : Number(v).toLocaleString();
                      return (
                        <td key={p.id} style={{ textAlign: "center", padding: "8px", borderBottom: "1px solid #f1f5f9", backgroundColor: p.is_featured ? "#f5f3ff" : "transparent" }}>
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {featureKeys.length > 0 && (
                  <tr>
                    <td colSpan={comparable.length + 1} style={{ padding: "10px 8px 4px", fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, backgroundColor: "#f8fafc" }}>
                      Features
                    </td>
                  </tr>
                )}
                {featureKeys.map((k) => (
                  <tr key={k}>
                    <td style={{ padding: "8px", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{featureLabel(k)}</td>
                    {comparable.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          borderBottom: "1px solid #f1f5f9",
                          fontWeight: 700,
                          color: p.features[k] ? "#16a34a" : "#cbd5e1",
                          backgroundColor: p.is_featured ? "#f5f3ff" : "transparent",
                        }}
                      >
                        {p.features[k] ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 24, paddingTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{pd.company.name}</div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>
              {pd.company.email} · {pd.company.phone}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
