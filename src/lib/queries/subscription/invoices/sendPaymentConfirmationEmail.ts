"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { sendEmail, EmailNotConfiguredError } from "@/lib/email/sendEmail";
import {
  paymentConfirmedHtml,
  paymentConfirmedSubject,
  paymentConfirmedText,
} from "@/lib/email/paymentConfirmedTemplate";
import { BILLING_CYCLE_LABELS, BillingCycle } from "@/lib/types/subscription.types";

type Owner = { email: string; first_name: string };
type StoreRow = { store_name: string; owner?: Owner | Owner[] | null };

const one = <T>(v: T | T[] | null | undefined): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

/**
 * Emails the store owner a receipt for a paid invoice. Everything in the email
 * is re-read from the database here - nothing is taken from the browser - so
 * the receipt always reflects what is actually recorded.
 */
export async function sendPaymentConfirmationEmail(invoiceId: string) {
  try {
    await requireSuperAdmin();

    const { data: inv, error } = await supabaseAdmin
      .from("subscription_invoices")
      .select(
        `
        invoice_number, plan_name, amount, currency, billing_cycle, status,
        paid_at, payment_method, payment_reference, period_start, period_end,
        stores:store_id (store_name, owner:owner_id (email, first_name))
      `,
      )
      .eq("id", invoiceId)
      .single();

    if (error || !inv) throw error ?? new Error("Invoice not found");
    if (inv.status !== "paid") {
      return { success: false as const, error: "Only paid invoices can be emailed." };
    }

    const store = one(inv.stores as StoreRow | StoreRow[] | null);
    const owner = one(store?.owner);

    if (!owner?.email) {
      return { success: false as const, error: "This store owner has no email address." };
    }

    const data = {
      ownerFirstName: owner.first_name,
      storeName: store?.store_name ?? "your store",
      invoiceNumber: inv.invoice_number as string,
      planName: inv.plan_name as string,
      billingCycleLabel:
        BILLING_CYCLE_LABELS[inv.billing_cycle as BillingCycle] ?? String(inv.billing_cycle),
      amount: Number(inv.amount) || 0,
      currency: (inv.currency as string) || "BDT",
      paidAt: new Date((inv.paid_at as string | null) ?? Date.now()),
      paymentMethod: inv.payment_method as string | null,
      paymentReference: inv.payment_reference as string | null,
      periodStart: new Date(inv.period_start as string),
      periodEnd: new Date(inv.period_end as string),
    };

    await sendEmail({
      to: owner.email,
      subject: paymentConfirmedSubject(data),
      html: paymentConfirmedHtml(data),
      text: paymentConfirmedText(data),
    });

    return { success: true as const, to: owner.email };
  } catch (err) {
    console.error("sendPaymentConfirmationEmail failed:", err);
    return {
      success: false as const,
      error:
        err instanceof EmailNotConfiguredError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to send email.",
    };
  }
}
