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
    const validStatuses = ["unpaid", "submitted", "paid", "cancelled", "refunded"];
    const normalized = (data ?? []).map((inv) => ({
      ...inv,
      // "canceled" (single-L) is the pre-fix spelling still present on older rows.
      status: inv.status === "canceled" ? "cancelled" : validStatuses.includes(inv.status) ? inv.status : "unpaid",
    }));
    return { success: true, data: normalized as SubscriptionInvoice[] };
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
    const validStatuses = ["unpaid", "submitted", "paid", "cancelled", "refunded"];
    const normalized = {
      ...data,
      // "canceled" (single-L) is the pre-fix spelling still present on older rows.
      status: data.status === "canceled" ? "cancelled" : validStatuses.includes(data.status) ? data.status : "unpaid",
    };
    return { success: true, data: normalized as SubscriptionInvoice };
  } catch (err) {
    console.error("getInvoiceById failed:", err);
    return { success: false, error: err, data: null };
  }
}
