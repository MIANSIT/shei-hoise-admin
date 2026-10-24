"use client";

import { BrandLogoPdfTile } from "@/app/component/common/BrandLogo";
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
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
        style={{
          display: "none",
          width: 794,
          backgroundColor: "#fff",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0E2438 0%, #13304A 55%, #1E4A74 100%)",
            padding: "38px 48px 50px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <BrandLogoPdfTile height={56} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{pd.company.name}</div>
                <div style={{ fontSize: 12, color: "#B0B7C0", marginTop: 2 }}>
                  Everything you need to launch and run your online store
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "#B0B7C0", whiteSpace: "nowrap" }}>{today}</div>
          </div>
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#B0B7C0", letterSpacing: 2.5, textTransform: "uppercase" }}>
              Pricing Plan
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginTop: 4 }}>{plan.name}</div>
            {plan.description && (
              <div style={{ fontSize: 13, color: "#E8EEF4", marginTop: 6, maxWidth: 620 }}>{plan.description}</div>
            )}
          </div>
        </div>

        <div style={{ padding: "0 48px 32px" }}>
          {/* Trial banner — overlaps the header bottom edge, mirrors the comparison PDF */}
          {plan.trial_days > 0 && (
            <div
              style={{
                marginTop: -24,
                marginBottom: 24,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #E3EBF3",
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
                  background: "#EEF3F8",
                  color: "#13304A",
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
                <span style={{ fontWeight: 800, color: "#0f172a" }}>Start free, no risk.</span>{" "}
                Every store gets {plan.trial_days} days of full access before billing begins.
              </div>
            </div>
          )}

          {/* Pricing */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #E8EEF4", padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                Monthly
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                {formatMoney(plan.price_monthly, plan.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>billed every month</div>
            </div>
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #E8EEF4", padding: "18px 16px", textAlign: "center", position: "relative" }}>
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
            <div style={{ flex: 1, borderRadius: 16, border: "2px solid #13304A", padding: "18px 16px", textAlign: "center", position: "relative" }}>
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
              <div style={{ fontSize: 10, fontWeight: 700, color: "#13304A", textTransform: "uppercase", letterSpacing: 1 }}>
                Yearly
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>
                {formatMoney(plan.price_yearly, plan.currency)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>billed every year</div>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: 10.5,
              color: "#3E6A96",
              background: "#F3F6FA",
              border: "1px dashed #D3DEEA",
              borderRadius: 8,
              padding: "9px 14px",
              marginBottom: 28,
            }}
          >
            Need a different term — 2, 4, or any custom number of months? Contact us — {pd.company.phone} · {pd.company.email}
          </div>

          {/* Features */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <span style={{ width: 4, height: 12, borderRadius: 2, background: "#7FA3C7", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#13304A", textTransform: "uppercase", letterSpacing: 1.2 }}>
                What&apos;s included
              </span>
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
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ width: 4, height: 12, borderRadius: 2, background: "#7FA3C7", display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#13304A", textTransform: "uppercase", letterSpacing: 1.2 }}>
                  Plan capacity
                </span>
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
              textAlign: "center", background: "linear-gradient(to right, #13304A, #1E4A74)",
              borderRadius: 14, padding: "18px 24px", marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Ready to launch your store?</div>
            <div style={{ fontSize: 12, color: "#E8EEF4", marginTop: 4 }}>
              Contact us today and we&apos;ll get your store live on this plan.
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 18, textAlign: "center" }}>
            <div style={{ height: 3, width: 56, borderRadius: 2, background: "linear-gradient(90deg, #0E2438, #2F6191)", margin: "0 auto 14px" }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>{pd.company.name}</div>
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3 }}>
              {pd.company.phone} · {pd.company.email} · {pd.company.website.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
