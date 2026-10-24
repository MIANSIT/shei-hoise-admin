import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";
import { LOGO_CID } from "./sendEmail";

// Palette sampled from logo_beta.png: deep navy mark + white/silver arrow.
const NAVY = "#13304A";
const NAVY_SOFT = "#E8EEF4";
const SILVER = "#B0B7C0";
const INK = "#1F2937";
const MUTED = "#64748B";
const PAGE_BG = "#F2F5F8";
const SUCCESS = "#15803D";
const SUCCESS_BG = "#DCFCE7";

export interface PaymentConfirmedData {
  ownerFirstName?: string | null;
  storeName: string;
  invoiceNumber: string;
  planName: string;
  billingCycleLabel: string;
  amount: number;
  currency: string;
  paidAt: Date;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  periodStart: Date;
  periodEnd: Date;
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const money = (amount: number, currency: string) =>
  `${currency === "BDT" ? "৳" : `${currency} `}${amount.toLocaleString("en-US")}`;

const METHOD_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  bank: "Bank Transfer",
  cash: "Cash",
  other: "Other",
};

const methodLabel = (m?: string | null) => (m ? (METHOD_LABELS[m] ?? m) : null);

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${NAVY_SOFT};font-size:13px;color:${MUTED};">${esc(label)}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${NAVY_SOFT};font-size:14px;font-weight:600;color:${INK};">${value}</td>
    </tr>`;
}

export function paymentConfirmedSubject(d: PaymentConfirmedData) {
  return `Payment confirmed – ${d.storeName} (${d.invoiceNumber})`;
}

export function paymentConfirmedText(d: PaymentConfirmedData) {
  const method = methodLabel(d.paymentMethod);
  return [
    `Hello${d.ownerFirstName ? ` ${d.ownerFirstName}` : ""},`,
    "",
    `We have received your payment for ${d.storeName}. Thank you!`,
    "",
    `Invoice: ${d.invoiceNumber}`,
    `Plan: ${d.planName} (${d.billingCycleLabel})`,
    `Amount paid: ${money(d.amount, d.currency)}`,
    `Paid on: ${fmtDate(d.paidAt)}`,
    ...(method ? [`Payment method: ${method}`] : []),
    ...(d.paymentReference ? [`Reference: ${d.paymentReference}`] : []),
    "",
    `Your subscription is active from ${fmtDate(d.periodStart)} until ${fmtDate(d.periodEnd)}.`,
    "",
    `Questions? ${PAYMENT_DETAILS.company.phone} · ${PAYMENT_DETAILS.company.email}`,
    "",
    PAYMENT_DETAILS.company.name,
  ].join("\n");
}

export function paymentConfirmedHtml(d: PaymentConfirmedData) {
  const method = methodLabel(d.paymentMethod);
  const c = PAYMENT_DETAILS.company;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Payment confirmed</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #DDE4EB;">

      <!-- Brand header -->
      <tr><td align="center" style="padding:28px 24px 18px;background:#ffffff;">
        <img src="cid:${LOGO_CID}" alt="${esc(c.name)}" height="84" style="display:block;height:84px;width:auto;border:0;margin:0 auto;">
        <div style="margin-top:6px;font-size:20px;font-weight:800;letter-spacing:.4px;color:${NAVY};">${esc(c.name)}</div>
      </td></tr>

      <!-- Headline band -->
      <tr><td align="center" style="background:${NAVY};padding:22px 24px;">
        <div style="display:inline-block;background:${SUCCESS_BG};color:${SUCCESS};font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">&#10003; Payment received</div>
        <div style="margin-top:12px;font-size:24px;font-weight:800;color:#ffffff;">Your payment is confirmed</div>
        <div style="margin-top:4px;font-size:14px;color:${SILVER};">${esc(d.storeName)}</div>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:28px 32px 8px;">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};">
          Hello${d.ownerFirstName ? ` ${esc(d.ownerFirstName)}` : ""},
        </p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:${INK};">
          Thank you! We have received your payment and your subscription is now active. Here is your receipt.
        </p>

        <!-- Amount -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY_SOFT};border-radius:12px;margin-bottom:20px;">
          <tr><td align="center" style="padding:18px 12px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${MUTED};">Amount paid</div>
            <div style="margin-top:4px;font-size:34px;font-weight:800;color:${NAVY};">${esc(money(d.amount, d.currency))}</div>
          </td></tr>
        </table>

        <!-- Details -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row("Invoice", `<span style="font-family:Consolas,Menlo,monospace;color:${NAVY};">${esc(d.invoiceNumber)}</span>`)}
          ${row("Plan", `${esc(d.planName)} <span style="font-weight:400;color:${MUTED};">&middot; ${esc(d.billingCycleLabel)}</span>`)}
          ${row("Paid on", esc(fmtDate(d.paidAt)))}
          ${method ? row("Payment method", esc(method)) : ""}
          ${d.paymentReference ? row("Reference", `<span style="font-family:Consolas,Menlo,monospace;">${esc(d.paymentReference)}</span>`) : ""}
        </table>

        <!-- Subscription period -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;border:1px solid ${NAVY};border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${MUTED};">Subscription period</div>
            <div style="margin-top:6px;font-size:16px;font-weight:700;color:${NAVY};">
              ${esc(fmtDate(d.periodStart))} &rarr; ${esc(fmtDate(d.periodEnd))}
            </div>
            <div style="margin-top:4px;font-size:13px;color:${MUTED};">Your next renewal is due on ${esc(fmtDate(d.periodEnd))}.</div>
          </td></tr>
        </table>
      </td></tr>

      <!-- Help -->
      <tr><td style="padding:18px 32px 30px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
          Need help or have a question about this payment? Just reply to this email or contact us:<br>
          <strong style="color:${INK};">${esc(c.phone)}</strong> &nbsp;&middot;&nbsp;
          <a href="mailto:${esc(c.email)}" style="color:${NAVY};text-decoration:underline;">${esc(c.email)}</a>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="background:${NAVY};padding:18px 24px;">
        <div style="font-size:13px;font-weight:700;color:#ffffff;">${esc(c.name)}</div>
        <div style="margin-top:3px;font-size:12px;color:${SILVER};">${esc(c.address)}</div>
      </td></tr>
    </table>
    <div style="max-width:600px;margin:14px auto 0;font-size:11px;line-height:1.5;color:${MUTED};text-align:center;">
      You are receiving this email because a payment was confirmed for your store on ${esc(c.name)}.
    </div>
  </td></tr>
</table>
</body>
</html>`;
}
