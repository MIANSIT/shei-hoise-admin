"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { SubscriptionPlan } from "@/lib/types/subscription.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";
import { featureLabel, limitLabel } from "@/lib/constants/planFeaturePresets";
import { effectiveHalfYearlyPrice, halfYearlySavingsPct } from "@/lib/utils/planComparison";

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "BDT" ? "৳" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Renders a "Download Pitch PDF" button for a single subscription plan.
 * Generates a sales-ready one-pager (pricing + included features/limits)
 * that a super admin can hand to a prospective store owner — separate from
 * the billing invoice PDF, which is for an already-assigned subscription.
 */
export function PlanPitchPdfButton({ plan }: { plan: SubscriptionPlan }) {
  const { success, error: notifyError } = useSheiNotification();
  const [generating, setGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const pd = PAYMENT_DETAILS;
  const includedFeatures = Object.entries(plan.features).filter(([, v]) => !!v);
  const limitEntries = Object.entries(plan.limits);

  const yearlyMonthlyEquivalent = plan.price_monthly * 12;
  const yearlySavingsPct =
    yearlyMonthlyEquivalent > 0 && plan.price_yearly > 0
      ? Math.round((1 - plan.price_yearly / yearlyMonthlyEquivalent) * 100)
      : 0;
  const halfYearlyPrice = effectiveHalfYearlyPrice(plan);
  const halfYearlySavings = halfYearlySavingsPct(plan.price_monthly, halfYearlyPrice);

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
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

      pdf.save(`${plan.slug || "plan"}-pricing.pdf`);
      success("Plan PDF downloaded!");
    } catch (err) {
      console.error("Plan PDF error:", err);
      el.style.cssText = "display:none;";
      notifyError("Failed to generate PDF. Please try again.");
    }
    setGenerating(false);
  };

  return (
    <>
      <button
        onClick={downloadPDF}
        disabled={generating}
        title="Download a shareable pricing PDF for this plan"
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-violet-50 dark:hover:bg-violet-500/10 disabled:opacity-60 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 text-xs font-medium transition"
      >
        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        Pitch PDF
      </button>

      {/* Hidden document captured by html2canvas */}
      <div
        ref={pdfRef}
        style={{ display: "none", width: 794, backgroundColor: "#fff", fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(to right, #7c3aed, #9333ea)",
            padding: "36px 48px",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{pd.company.name}</div>
          <div style={{ fontSize: 12, color: "#ddd8fe", marginTop: 2 }}>
            Everything you need to launch and run your online store
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ddd8fe", letterSpacing: 3, textTransform: "uppercase" }}>
              Pricing Plan
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginTop: 2 }}>{plan.name}</div>
            {plan.description && (
              <div style={{ fontSize: 13, color: "#ede9fe", marginTop: 6, maxWidth: 620 }}>{plan.description}</div>
            )}
          </div>
        </div>

        <div style={{ padding: "32px 48px" }}>
          {/* Pricing */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #ede9fe", padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                Monthly
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                {formatMoney(plan.price_monthly, plan.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>billed every month</div>
            </div>
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #ede9fe", padding: "18px 16px", textAlign: "center", position: "relative" }}>
              {halfYearlySavings > 0 && (
                <div
                  style={{
                    position: "absolute", top: -12, right: 12, backgroundColor: "#16a34a", color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  }}
                >
                  Save {halfYearlySavings}%
                </div>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                Half Yearly
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                {formatMoney(halfYearlyPrice, plan.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>billed every 6 months</div>
            </div>
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #7c3aed", padding: "18px 16px", textAlign: "center", position: "relative" }}>
              {yearlySavingsPct > 0 && (
                <div
                  style={{
                    position: "absolute", top: -12, right: 12, backgroundColor: "#16a34a", color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  }}
                >
                  Save {yearlySavingsPct}%
                </div>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1 }}>
                Yearly
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                {formatMoney(plan.price_yearly, plan.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>billed every year</div>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginBottom: 28 }}>
            Need a different term — 2, 4, or any custom number of months? Contact us — {pd.company.phone} · {pd.company.email}
          </div>

          {plan.trial_days > 0 && (
            <div
              style={{
                textAlign: "center", backgroundColor: "#fdf4ff", border: "1px solid #f0abfc", borderRadius: 12,
                padding: "10px 16px", marginBottom: 28, fontSize: 13, fontWeight: 700, color: "#a21caf",
              }}
            >
              🎁 Starts with a {plan.trial_days}-day free trial — no risk to get started
            </div>
          )}

          {/* Features */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              What&apos;s included
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              {[
                "Full e-commerce storefront",
                "Merchant admin dashboard",
                "Order & inventory management",
                "Coupons & flash sales",
                "Customer accounts & reviews",
                ...includedFeatures.map(([k]) => featureLabel(k)),
              ].map((label, i) => (
                <div key={`${label}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#334155" }}>
                  <span style={{ color: "#16a34a", fontWeight: 900 }}>✓</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          {limitEntries.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                Plan capacity
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {limitEntries.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex", justifyContent: "space-between", backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{limitLabel(k)}</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      {Number(v) === -1 ? "Unlimited" : Number(v).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA / Footer */}
          <div
            style={{
              textAlign: "center", background: "linear-gradient(to right, #7c3aed, #9333ea)",
              borderRadius: 14, padding: "18px 24px", marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Ready to launch your store?</div>
            <div style={{ fontSize: 12, color: "#ede9fe", marginTop: 4 }}>
              Contact us today and we&apos;ll get your store live on this plan.
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{pd.company.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {pd.company.email} · {pd.company.phone}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
