"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { StoreSubscription } from "@/lib/types/subscription.types";

export async function getStoreSubscriptions() {
  try {
    const { data, error } = await supabaseAdmin
      .from("store_subscriptions")
      .select(
        `
        *,
        stores:store_id (
          id,
          store_name,
          store_slug,
          owner:owner_id (id, email, first_name, last_name)
        ),
        subscription_plans:plan_id (id, name, slug, price_monthly, price_yearly),
        subscription_invoices (id, invoice_number, status, created_at)
      `
      )
      .order("created_at", { ascending: false })
      .order("created_at", { ascending: false, foreignTable: "subscription_invoices" })
      .limit(1, { foreignTable: "subscription_invoices" });

    if (error) throw error;
    return { success: true, data: data as StoreSubscription[] };
  } catch (err) {
    console.error("getStoreSubscriptions failed:", err);
    return { success: false, error: err, data: [] as StoreSubscription[] };
  }
}
