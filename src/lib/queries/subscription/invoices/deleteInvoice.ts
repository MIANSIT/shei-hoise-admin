"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function deleteInvoice(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("subscription_invoices")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteInvoice failed:", err);
    return { success: false, error: err };
  }
}
