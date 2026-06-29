"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { SubscriptionInvoice } from "@/lib/types/invoice.types";

export async function getInvoices() {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscription_invoices")
      .select(
        `
        *,
        stores:store_id (
          id,
          store_name,
          store_slug,
          owner:owner_id (id, email, first_name, last_name)
        ),
        subscription_plans:plan_id (id, name, slug)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data as SubscriptionInvoice[] };
  } catch (err) {
    console.error("getInvoices failed:", err);
    return { success: false, error: err, data: [] as SubscriptionInvoice[] };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscription_invoices")
      .select(
        `
        *,
        stores:store_id (
          id,
          store_name,
          store_slug,
          owner:owner_id (id, email, first_name, last_name)
        ),
        subscription_plans:plan_id (id, name, slug)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data: data as SubscriptionInvoice };
  } catch (err) {
    console.error("getInvoiceById failed:", err);
    return { success: false, error: err, data: null };
  }
}
