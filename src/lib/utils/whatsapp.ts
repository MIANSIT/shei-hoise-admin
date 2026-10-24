import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";

/**
 * Normalise a Bangladeshi phone number to the international digits-only form
 * wa.me expects (e.g. "01712-345678" -> "8801712345678"). Returns null when it
 * doesn't look like a usable number.
 */
export function toWhatsAppNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("880")) {
    // already international
  } else if (digits.startsWith("0")) {
    digits = `88${digits}`;
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = `880${digits}`;
  }
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export interface RenewalReminderInput {
  ownerFirstName?: string | null;
  storeName: string;
  planName: string;
  periodEnd: Date;
  /** Cycle label, e.g. "Monthly". Shown next to the price. */
  cycleLabel: string;
  /** Price of the plan the store is on, for its billing cycle. */
  amount: number;
  currency?: string;
  /** Custom durations have no fixed price list, so the owner is told to get in touch. */
  isCustom: boolean;
  /** Length of the store's custom period in months (only used when isCustom). */
  customMonths?: number;
  /** Free/trial plan: there is nothing to pay, the owner has to pick a paid plan. */
  isTrial?: boolean;
  /** Other billing cycles of the same plan the owner could switch to. */
  otherCycles?: { label: string; amount: number }[];
}

export function buildRenewalReminder(input: RenewalReminderInput): string {
  const { ownerFirstName, storeName, planName, periodEnd, amount, cycleLabel, isCustom, customMonths, isTrial, otherCycles } = input;
  const daysLeft = Math.ceil((periodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const date = periodEnd.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const when =
    daysLeft < 0
      ? `ended on ${date}`
      : daysLeft === 0
        ? `ends today (${date})`
        : `ends on ${date} (${daysLeft} day${daysLeft > 1 ? "s" : ""} left)`;

  const symbol = !input.currency || input.currency === "BDT" ? "৳" : `${input.currency} `;
  const intro = [
    `Hello${ownerFirstName ? ` ${ownerFirstName}` : ""},`,
    "",
    `This is ${PAYMENT_DETAILS.company.name}. Your *${storeName}* subscription (${planName} plan) ${when}.`,
    "",
  ];

  if (isTrial) {
    return [
      `Hello${ownerFirstName ? ` ${ownerFirstName}` : ""},`,
      "",
      `This is ${PAYMENT_DETAILS.company.name}. Your *${storeName}* free trial ${when}.`,
      "",
      "To keep your store running, please choose a plan:",
      "1. Log in to your store admin panel",
      "2. Open *My Plan*",
      "3. Select the plan you want and follow the steps to pay",
      "",
      "If you need help choosing a plan, just reply to this message.",
      "",
      `• WhatsApp / Call: ${PAYMENT_DETAILS.company.phone}`,
      `• Email: ${PAYMENT_DETAILS.company.email}`,
      "",
      "Thank you!",
    ].join("\n");
  }

  if (isCustom) {
    const months = customMonths && customMonths > 0 ? customMonths : null;
    return [
      ...intro,
      months
        ? `Your plan is a custom ${months}-month plan, so the renewal price is confirmed by us. Please reply to this message and tell us if you want to renew for ${months} month${months > 1 ? "s" : ""} again or a different number of months.`
        : "Your plan has a custom duration, so the renewal price is confirmed by us. Please reply to this message and tell us how many months you would like.",
      "",
      "Once we confirm the amount, pay by Send Money:",
      `• bKash: ${PAYMENT_DETAILS.bkash.number}`,
      `• Nagad: ${PAYMENT_DETAILS.nagad.number}`,
      "",
      "After paying, please reply with the transaction ID.",
      "",
      `• WhatsApp / Call: ${PAYMENT_DETAILS.company.phone}`,
      `• Email: ${PAYMENT_DETAILS.company.email}`,
      "",
      "Thank you!",
    ].join("\n");
  }

  return [
    ...intro,
    `To keep your store running without interruption, please renew your ${planName} plan (${cycleLabel}): *${symbol}${amount.toLocaleString()}*.`,
    "",
    ...(otherCycles && otherCycles.length > 0
      ? [
          `Want to switch to a different duration? ${planName} plan prices:`,
          ...otherCycles.map((c) => `• ${c.label}: ${symbol}${c.amount.toLocaleString()}`),
          "Just reply and tell us which one you prefer.",
          "",
        ]
      : []),
    "Pay by Send Money:",
    `• bKash: ${PAYMENT_DETAILS.bkash.number}`,
    `• Nagad: ${PAYMENT_DETAILS.nagad.number}`,
    "",
    "After paying, please reply with the transaction ID.",
    "Thank you!",
  ].join("\n");
}

export function whatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
