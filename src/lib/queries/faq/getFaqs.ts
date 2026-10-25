"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { Faq } from "@/lib/types/faq.types";

export async function getFaqs() {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { success: true, data: data as Faq[] };
  } catch (err) {
    console.error("getFaqs failed:", err);
    return { success: false, error: err, data: [] as Faq[] };
  }
}
