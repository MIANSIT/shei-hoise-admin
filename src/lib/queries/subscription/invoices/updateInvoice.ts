"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { UpdateInvoiceInput } from "@/lib/types/invoice.types";

export async function updateInvoice(id: string, input: UpdateInvoiceInput) {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("subscription_invoices")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateInvoice failed:", err);
    return { success: false, error: err };
  }
}

export async function markInvoicePaid(
  id: string,
  payment_method: string,
  payment_reference?: string
) {
  return updateInvoice(id, {
    status: "paid",
    paid_at: new Date().toISOString(),
    payment_method,
    payment_reference: payment_reference ?? null,
  });
}
