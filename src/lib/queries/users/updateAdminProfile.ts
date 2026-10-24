"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export interface UpdateAdminProfileInput {
  first_name: string;
  last_name: string;
  phone: string | null;
}

// Only ever touches the caller's own row: the id comes from the verified
// session, never from the client.
export async function updateAdminProfile(input: UpdateAdminProfileInput) {
  try {
    const user = await requireSuperAdmin();

    const first_name = input.first_name.trim();
    const last_name = input.last_name.trim();
    const phone = input.phone?.trim() || null;

    if (!first_name || !last_name) {
      return { success: false, error: "First and last name are required." };
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ first_name, last_name, phone })
      .eq("id", user.id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("updateAdminProfile failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile.",
    };
  }
}
