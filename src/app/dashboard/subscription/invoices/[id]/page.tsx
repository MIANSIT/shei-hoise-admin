"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal, Select } from "antd";
import {
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Building2,
  Smartphone,
  Loader2,
} from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getInvoiceById } from "@/lib/queries/subscription/invoices/getInvoices";
import {
  markInvoicePaid,
  updateInvoice,
} from "@/lib/queries/subscription/invoices/updateInvoice";
import {
  SubscriptionInvoice,
  InvoiceStatus,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/types/invoice.types";
import { BILLING_CYCLE_LABELS } from "@/lib/types/subscription.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = INVOICE_STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {INVOICE_STATUS_LABELS[status].toUpperCase()}
    </span>
  );
}

function PaymentMethodCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 ${color} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="font-bold text-sm">{title}</span>
      </div>
      {children}
    </div>
  );
}

// PDF status badge colors (plain values for inline styles)
const PDF_STATUS: Record<string, { bg: string; text: string }> = {
  unpaid:   { bg: "#FEF9C3", text: "#854D0E" },
  paid:     { bg: "#D1FAE5", text: "#065F46" },
  canceled: { bg: "#FEE2E2", text: "#991B1B" },
  refunded: { bg: "#E0E7FF", text: "#3730A3" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: notifyError } = useSheiNotification();

  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("bkash");
  const [payRef, setPayRef] = useState("");
  const [marking, setMarking] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const pdfInvoiceRef = useRef<HTMLDivElement>(null);
  const pdfPaymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getInvoiceById(params.id as string);
      if (res.success && res.data) setInvoice(res.data);
      setLoading(false);
    };
    load();
  }, [params.id]);

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setMarking(true);
    const res = await markInvoicePaid(invoice.id, payMethod, payRef || undefined);
    if (res.success) {
      success("Invoice marked as paid");
      setInvoice((prev) =>
        prev
          ? { ...prev, status: "paid", paid_at: new Date().toISOString(), payment_method: payMethod, payment_reference: payRef || null }
          : prev
      );
      setMarkPaidOpen(false);
      setPayRef("");
    } else {
      notifyError("Failed to update invoice");
    }
    setMarking(false);
  };

  const handleCancel = async () => {
    if (!invoice) return;
    setCanceling(true);
    const res = await updateInvoice(invoice.id, { status: "canceled" });
    if (res.success) {
      success("Invoice canceled");
      setInvoice((prev) => (prev ? { ...prev, status: "canceled" } : prev));
      setCancelOpen(false);
    } else {
      notifyError("Failed to cancel invoice");
    }
    setCanceling(false);
  };

  const downloadPDF = async () => {
    if (!invoice || !pdfInvoiceRef.current || !pdfPaymentRef.current) return;
    setGenerating(true);
    const el1 = pdfInvoiceRef.current;
    const el2 = pdfPaymentRef.current;
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // Show elements (covered by generating overlay)
      el1.style.cssText = "display:block;position:fixed;top:0;left:0;width:794px;z-index:10000;background:#fff;";
      el2.style.cssText = "display:block;position:fixed;top:0;left:0;width:794px;z-index:10000;background:#fff;";

      await new Promise((r) => setTimeout(r, 200));

      // Collect link positions using offsetTop traversal (more reliable than getBoundingClientRect for tall elements)
      const collectLinks = (container: HTMLElement) => {
        return Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]")).map((a) => {
          let x = 0, y = 0;
          let el: HTMLElement | null = a;
          while (el && el !== container) {
            x += el.offsetLeft;
            y += el.offsetTop;
            el = el.offsetParent as HTMLElement | null;
          }
          return {
            href: a.getAttribute("href") ?? "",
            x,
            y,
            w: a.offsetWidth,
            h: a.offsetHeight,
          };
        });
      };

      const links1 = collectLinks(el1);
      const links2 = collectLinks(el2);

      const [canvas1, canvas2] = await Promise.all([
        html2canvas(el1, {
          scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
          height: el1.scrollHeight, windowHeight: el1.scrollHeight,
        }),
        html2canvas(el2, {
          scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
          height: el2.scrollHeight, windowHeight: el2.scrollHeight,
        }),
      ]);

      el1.style.cssText = "display:none;";
      el2.style.cssText = "display:none;";

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const scale = pdfW / 794; // element px → PDF pt

      const addPage = (
        canvas: HTMLCanvasElement,
        links: { href: string; x: number; y: number; w: number; h: number }[],
        isFirst: boolean
      ) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const imgH = (canvas.height / canvas.width) * pdfW;
        if (!isFirst) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, Math.min(imgH, pdfH));
        // Add invisible link hotspots at precise positions
        links.forEach(({ href, x, y, w, h }) => {
          if (!href) return;
          const px = x * scale;
          const py = y * scale;
          const pw = Math.max(w * scale, 30); // min 30pt hit area
          const ph = Math.max(h * scale, 10); // min 10pt hit area
          if (py < pdfH) pdf.link(px, py, pw, ph, { url: href });
        });
      };

      addPage(canvas1, links1, true);
      addPage(canvas2, links2, false);

      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
      success("PDF downloaded!");
    } catch (err) {
      console.error("PDF error:", err);
      el1.style.cssText = "display:none;";
      el2.style.cssText = "display:none;";
      notifyError("Failed to generate PDF. Please try again.");
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl opacity-40">🧾</div>
        <p className="text-slate-500">Invoice not found.</p>
        <button onClick={() => router.back()} className="text-sm text-violet-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const store = invoice.stores;
  const owner = store?.owner;
  const pd = PAYMENT_DETAILS;
  const isUnpaid = invoice.status === "unpaid";

  const bkashSendAmount      = Math.ceil(invoice.amount * (1 + pd.bkash.chargeRate));
  const bkashCharge          = bkashSendAmount - invoice.amount;
  const bkashPriyoSendAmount = Math.ceil(invoice.amount * (1 + pd.bkash.priyoChargeRate));
  const bkashPriyoCharge     = bkashPriyoSendAmount - invoice.amount;
  const nagadSendAmount      = Math.ceil(invoice.amount * (1 + pd.nagad.chargeRate));
  const nagadCharge          = nagadSendAmount - invoice.amount;

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";

  const pdfStatus = PDF_STATUS[invoice.status] ?? PDF_STATUS.unpaid;

  return (
    <>
      {/* ─── SCREEN UI ──────────────────────────────────────────────── */}
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4">

        {/* Generating overlay — hides the brief PDF render flash */}
        {generating && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001]">
            <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-3 shadow-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <span className="text-sm font-semibold text-slate-700">Generating PDF…</span>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="max-w-[820px] mx-auto flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </button>
          <div className="flex items-center gap-2">
            {isUnpaid && (
              <button
                onClick={() => setMarkPaidOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
            {isUnpaid && (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/[0.08] hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 hover:text-red-600 text-sm font-semibold transition"
              >
                <XCircle className="w-4 h-4" />
                Cancel Invoice
              </button>
            )}
            <button
              onClick={downloadPDF}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice document (screen view) */}
        <div className="max-w-[820px] mx-auto bg-white rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-none">

          {/* Header band */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-3xl px-10 py-7 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{pd.company.name}</h1>
              <p className="text-violet-200 text-sm mt-0.5">{pd.company.email}</p>
              <p className="text-violet-200 text-sm">{pd.company.address}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white tracking-widest">INVOICE</div>
              <div className="text-violet-200 font-mono text-sm mt-1">#{invoice.invoice_number}</div>
              <div className="mt-2"><StatusBadge status={invoice.status} /></div>
            </div>
          </div>

          <div className="px-10 py-8">
            {/* Bill To + Invoice Meta */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
                <p className="font-bold text-slate-900 text-base">{store?.store_name ?? "—"}</p>
                {owner && (
                  <>
                    <p className="text-sm text-slate-600 mt-0.5">{owner.first_name} {owner.last_name}</p>
                    <p className="text-sm text-slate-500">{owner.email}</p>
                  </>
                )}
                <p className="text-xs text-slate-400 mt-1">Store: {store?.store_slug}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Invoice Details</p>
                {[
                  ["Invoice #", invoice.invoice_number],
                  ["Invoice Date", formatDate(invoice.created_at)],
                  ["Due Date", formatDate(invoice.due_date)],
                  ...(invoice.status === "paid" && invoice.paid_at ? [["Paid On", formatDate(invoice.paid_at)]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-end gap-4 text-sm mb-1">
                    <span className="text-slate-400 font-medium">{label}:</span>
                    <span className="text-slate-700 font-semibold w-36 text-left">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold">Description</th>
                    <th className="px-5 py-3 text-left font-semibold">Billing</th>
                    <th className="px-5 py-3 text-left font-semibold">Period</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{invoice.plan_name} Plan</p>
                      <p className="text-xs text-slate-400">Subscription</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{BILLING_CYCLE_LABELS[invoice.billing_cycle]}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      ৳{invoice.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-5 py-4 text-right font-bold text-slate-600 uppercase tracking-wider text-sm">
                      Total Due
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-2xl font-extrabold text-violet-700">৳{invoice.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">{invoice.currency}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment methods (screen only) */}
            {isUnpaid && (
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">How to Pay</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PaymentMethodCard icon={<Smartphone className="w-5 h-5 text-pink-600" />} title="bKash" color="border-pink-200 bg-pink-50">
                    <p className="text-xs text-slate-500 mb-1"><span className="font-semibold text-slate-700">Send to ({pd.bkash.accountType}):</span></p>
                    <p className="text-base font-mono font-bold text-pink-700 mb-3">{pd.bkash.number}</p>
                    <div className="bg-emerald-500 rounded-xl px-3 py-2.5 mb-2 text-center">
                      <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">⭐ Priyo — Send exactly</p>
                      <p className="text-2xl font-extrabold text-white">৳{bkashPriyoSendAmount.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-100 mt-0.5">৳{invoice.amount.toLocaleString()} + ৳{bkashPriyoCharge} ({pd.bkash.priyoCharge})</p>
                    </div>
                    <div className="bg-pink-600 rounded-xl px-3 py-2.5 mb-3 text-center">
                      <p className="text-[10px] font-bold text-pink-200 uppercase tracking-wider mb-0.5">Regular — Send exactly</p>
                      <p className="text-2xl font-extrabold text-white">৳{bkashSendAmount.toLocaleString()}</p>
                      <p className="text-[11px] text-pink-200 mt-0.5">৳{invoice.amount.toLocaleString()} + ৳{bkashCharge} ({pd.bkash.cashoutCharge})</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{pd.bkash.instructions}</p>
                  </PaymentMethodCard>

                  <PaymentMethodCard icon={<Smartphone className="w-5 h-5 text-orange-500" />} title="Nagad" color="border-orange-200 bg-orange-50">
                    <p className="text-xs text-slate-500 mb-1"><span className="font-semibold text-slate-700">Send to ({pd.nagad.accountType}):</span></p>
                    <p className="text-base font-mono font-bold text-orange-600 mb-3">{pd.nagad.number}</p>
                    <div className="bg-orange-500 rounded-xl px-3 py-3 mb-3 text-center">
                      <p className="text-[10px] font-bold text-orange-100 uppercase tracking-wider mb-0.5">Send exactly</p>
                      <p className="text-2xl font-extrabold text-white">৳{nagadSendAmount.toLocaleString()}</p>
                      <p className="text-[11px] text-orange-100 mt-0.5">৳{invoice.amount.toLocaleString()} + ৳{nagadCharge} ({pd.nagad.cashoutCharge})</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{pd.nagad.instructions}</p>
                  </PaymentMethodCard>

                  <PaymentMethodCard icon={<Building2 className="w-5 h-5 text-blue-600" />} title="Bank Transfer" color="border-blue-200 bg-blue-50">
                    {[
                      ["Bank", pd.bank.bankName],
                      ["Account", pd.bank.accountName],
                      ["Acc. No", pd.bank.accountNumber],
                      ["Branch", pd.bank.branch],
                      ["Routing", pd.bank.routingNumber],
                    ].map(([label, val]) => (
                      <p key={label} className="text-[11px] text-slate-500 mb-0.5">
                        <span className="font-semibold text-slate-700">{label}:</span> <span className="font-mono">{val}</span>
                      </p>
                    ))}
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{pd.bank.instructions}</p>
                  </PaymentMethodCard>
                </div>

                <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-amber-500 text-base leading-5 mt-0.5 shrink-0">⚠️</span>
                  <p className="text-sm text-amber-800 leading-5">
                    Always use <strong className="font-mono">{invoice.invoice_number}</strong> as payment reference.
                  </p>
                </div>
              </div>
            )}

            {/* Paid details */}
            {invoice.status === "paid" && (
              <div className="mb-8 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-700">Payment Received</p>
                  <p className="text-sm text-emerald-600">
                    Paid on {formatDate(invoice.paid_at)}
                    {invoice.payment_method && ` via ${invoice.payment_method}`}
                    {invoice.payment_reference && ` · Ref: ${invoice.payment_reference}`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-600 mb-0.5">{pd.company.name}</p>
              <p>
                <a href={`mailto:${pd.company.email}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="hover:opacity-70 transition">{pd.company.email}</a>
                {" · "}
                <a href={`tel:${pd.company.phone}`} style={{ color: "inherit", textDecoration: "none" }} className="hover:opacity-70 transition">{pd.company.phone}</a>
                {" · "}
                <a href={pd.company.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="hover:opacity-70 transition">Contact Us</a>
              </p>
              <p className="mt-1">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PDF PAGE 1 — Invoice (hidden, captured by html2canvas) ─── */}
      <div
        ref={pdfInvoiceRef}
        style={{ display: "none", width: 794, backgroundColor: "#fff", fontFamily: "Arial, sans-serif" }}
      >
        {/* Gradient header */}
        <div style={{ background: "linear-gradient(to right, #7c3aed, #9333ea)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{pd.company.name}</div>
            <div style={{ fontSize: 12, color: "#ddd8fe", marginTop: 4 }}>{pd.company.email}</div>
            <div style={{ fontSize: 12, color: "#ddd8fe" }}>{pd.company.address}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: 4 }}>INVOICE</div>
            <div style={{ fontSize: 12, color: "#ddd8fe", fontFamily: "monospace", marginTop: 4 }}>#{invoice.invoice_number}</div>
            <div style={{ marginTop: 8, display: "inline-block", padding: "3px 14px", borderRadius: 20, backgroundColor: pdfStatus.bg, color: pdfStatus.text, fontSize: 11, fontWeight: 700 }}>
              {INVOICE_STATUS_LABELS[invoice.status].toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ padding: "32px 40px" }}>
          {/* Bill To + Details */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Bill To</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{store?.store_name ?? "—"}</div>
              {owner && (
                <>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{owner.first_name} {owner.last_name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{owner.email}</div>
                </>
              )}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Store: {store?.store_slug}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Invoice Details</div>
              {[
                ["Invoice #", invoice.invoice_number],
                ["Invoice Date", formatDate(invoice.created_at)],
                ["Due Date", formatDate(invoice.due_date)],
                ...(invoice.status === "paid" && invoice.paid_at ? [["Paid On", formatDate(invoice.paid_at)]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}:</span>
                  <span style={{ fontSize: 12, color: "#334155", fontWeight: 600, minWidth: 150, textAlign: "left" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", marginBottom: 32, fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {(["Description", "Billing", "Period", "Amount"] as const).map((h, i) => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, textAlign: i === 3 ? "right" : "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{invoice.plan_name} Plan</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Subscription</div>
                </td>
                <td style={{ padding: "14px 16px", color: "#475569", borderBottom: "1px solid #f1f5f9" }}>{BILLING_CYCLE_LABELS[invoice.billing_cycle]}</td>
                <td style={{ padding: "14px 16px", color: "#475569", borderBottom: "1px solid #f1f5f9" }}>{formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}</td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>৳{invoice.amount.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                <td colSpan={3} style={{ padding: "14px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Total Due</td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#7c3aed" }}>৳{invoice.amount.toLocaleString()}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{invoice.currency}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Paid badge */}
          {invoice.status === "paid" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 20px", marginBottom: 24 }}>
              <span style={{ color: "#16a34a", fontSize: 20, fontWeight: 700 }}>✓</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>Payment Received</div>
                <div style={{ fontSize: 12, color: "#16a34a" }}>
                  Paid on {formatDate(invoice.paid_at)}
                  {invoice.payment_method ? ` via ${invoice.payment_method}` : ""}
                  {invoice.payment_reference ? ` · Ref: ${invoice.payment_reference}` : ""}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{pd.company.name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              <a href={`mailto:${pd.company.email}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{pd.company.email}</a>
              {" · "}
              <a href={`tel:${pd.company.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{pd.company.phone}</a>
              {" · "}
              <a href={pd.company.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Contact Us</a>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Thank you for your business!</div>
          </div>
        </div>
      </div>

      {/* ─── PDF PAGE 2 — Payment Guide (hidden, captured by html2canvas) ─── */}
      <div
        ref={pdfPaymentRef}
        style={{ display: "none", width: 794, backgroundColor: "#fff", fontFamily: "Arial, sans-serif" }}
      >
        {/* Header band */}
        <div style={{ background: "linear-gradient(to right, #7c3aed, #9333ea)", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>Payment Guide</div>
            <div style={{ fontSize: 12, color: "#ddd8fe", marginTop: 2 }}>Invoice #{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{pd.company.name}</div>
            <div style={{ fontSize: 11, color: "#ddd8fe" }}>{pd.company.email}</div>
          </div>
        </div>

        <div style={{ padding: "28px 40px" }}>
          {/* Reference reminder */}
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div style={{ fontSize: 13, color: "#92400e" }}>
              Always use{" "}
              <strong style={{ fontFamily: "monospace", backgroundColor: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>
                {invoice.invoice_number}
              </strong>{" "}
              as payment reference / note so we can match your payment.
            </div>
          </div>

          {/* Amount summary */}
          <div style={{ textAlign: "center", marginBottom: 24, padding: "16px", backgroundColor: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Invoice Amount</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#7c3aed" }}>
              ৳{invoice.amount.toLocaleString()}{" "}
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}>{invoice.currency}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Due: {formatDate(invoice.due_date)}</div>
          </div>

          {/* bKash */}
          <div style={{ marginBottom: 16, borderRadius: 10, border: "1px solid #fbcfe8", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#fdf2f8", padding: "12px 20px", borderBottom: "1px solid #fbcfe8", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📱</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#be185d" }}>bKash</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>· Personal ·</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#db2777" }}>{pd.bkash.number}</span>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", gap: 14 }}>
              {/* Priyo */}
              <div style={{ flex: 1, backgroundColor: "#dcfce7", borderRadius: 8, padding: "14px 16px", textAlign: "center", border: "1px solid #86efac" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>⭐ Priyo — Send Exactly</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#15803d" }}>৳{bkashPriyoSendAmount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>৳{invoice.amount.toLocaleString()} + ৳{bkashPriyoCharge} charge ({pd.bkash.priyoCharge})</div>
              </div>
              {/* Regular */}
              <div style={{ flex: 1, backgroundColor: "#fce7f3", borderRadius: 8, padding: "14px 16px", textAlign: "center", border: "1px solid #f9a8d4" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9d174d", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Regular — Send Exactly</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#be185d" }}>৳{bkashSendAmount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#db2777", marginTop: 4 }}>৳{invoice.amount.toLocaleString()} + ৳{bkashCharge} charge ({pd.bkash.cashoutCharge})</div>
              </div>
            </div>
            <div style={{ padding: "0 20px 12px", fontSize: 11, color: "#64748b" }}>{pd.bkash.instructions}</div>
          </div>

          {/* Nagad */}
          <div style={{ marginBottom: 16, borderRadius: 10, border: "1px solid #fed7aa", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#fff7ed", padding: "12px 20px", borderBottom: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📱</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#c2410c" }}>Nagad</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>· Personal ·</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#ea580c" }}>{pd.nagad.number}</span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ backgroundColor: "#ffedd5", borderRadius: 8, padding: "14px 16px", textAlign: "center", border: "1px solid #fdba74" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Send Exactly</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#c2410c" }}>৳{nagadSendAmount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#ea580c", marginTop: 4 }}>৳{invoice.amount.toLocaleString()} + ৳{nagadCharge} charge ({pd.nagad.cashoutCharge})</div>
              </div>
            </div>
            <div style={{ padding: "0 20px 12px", fontSize: 11, color: "#64748b" }}>{pd.nagad.instructions}</div>
          </div>

          {/* Bank Transfer */}
          <div style={{ marginBottom: 20, borderRadius: 10, border: "1px solid #bfdbfe", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#eff6ff", padding: "12px 20px", borderBottom: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🏦</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Bank Transfer</span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Bank", pd.bank.bankName],
                    ["Account Name", pd.bank.accountName],
                    ["Account Number", pd.bank.accountNumber],
                    ["Branch", pd.bank.branch],
                    ["Routing Number", pd.bank.routingNumber],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ fontSize: 12, fontWeight: 600, color: "#334155", padding: "5px 0", width: "35%" }}>{label}:</td>
                      <td style={{ fontSize: 12, fontFamily: "monospace", color: "#1d4ed8", padding: "5px 0", fontWeight: 600 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "0 20px 12px", fontSize: 11, color: "#64748b" }}>{pd.bank.instructions}</div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {"Questions? "}
              <a href={`mailto:${pd.company.email}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>{pd.company.email}</a>
              {" · "}
              <a href={`tel:${pd.company.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{pd.company.phone}</a>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              <a href={pd.company.website} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Contact Us</a>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <Modal
        open={markPaidOpen}
        onCancel={() => { setMarkPaidOpen(false); setPayRef(""); setPayMethod("bkash"); }}
        onOk={handleMarkPaid}
        okText={marking ? "Saving…" : "Confirm Payment"}
        okButtonProps={{ style: { backgroundColor: "#10b981", borderColor: "#10b981" }, loading: marking }}
        cancelText="Cancel"
        title="Mark Invoice as Paid"
        width={420}
        destroyOnHidden
      >
        <div className="flex flex-col gap-3 py-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Payment Method</label>
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Transaction / Reference ID (optional)</label>
            <input className={inputCls} placeholder="e.g. TX123456" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={handleCancel}
        okText={canceling ? "Canceling…" : "Cancel Invoice"}
        okButtonProps={{ danger: true, loading: canceling }}
        cancelText="Keep"
        title="Cancel Invoice"
        width={400}
        destroyOnHidden
      >
        <p className="text-sm text-slate-600">
          Mark this invoice as canceled? The store owner will no longer be expected to pay it.
        </p>
      </Modal>
    </>
  );
}
