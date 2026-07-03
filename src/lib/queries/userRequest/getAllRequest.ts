// lib/queries/getAllRequest.ts
import { supabaseAdmin } from "@/lib/supabase";

export const getAllRequest = async () => {
  const { data, error } = await supabaseAdmin
    .from("contact_us")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data;
};

// Toggle is_solved
export const toggleSolved = async (id: string, is_solved: boolean) => {
  const { data, error } = await supabaseAdmin
    .from("contact_us")
    .update({ is_solved })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating is_solved:", error);
    return null;
  }
  return data;
};
