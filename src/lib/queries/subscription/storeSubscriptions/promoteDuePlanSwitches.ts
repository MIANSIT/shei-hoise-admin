"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getPendingPlanSwitch, withoutPendingPlanSwitch } from "@/lib/utils/planSwitch";

// The real enforcement is the pg_cron job (see the migration) so a switch
// applies even if nobody opens this admin panel. This is the manual "apply
// now" button plus a JS-side fallback in case pg_cron isn't available on the
// Supabase plan — same promotion logic, just triggered by a click instead of
// a schedule.
export async function promoteDuePlanSwitches() {
  try {
    await requireSuperAdmin();
    const { data: subs, error: fetchError } = await supabaseAdmin
      .from("store_subscriptions")
      .select("id, metadata")
      .not("metadata->pending_plan_id", "is", null);

    if (fetchError) throw fetchError;

    const now = new Date();
    const due = (subs ?? []).filter((s) => {
      const pending = getPendingPlanSwitch(s.metadata as Record<string, unknown>);
      return pending && new Date(pending.pending_plan_effective_at) <= now;
    });

    let promoted = 0;
    for (const sub of due) {
      const pending = getPendingPlanSwitch(sub.metadata as Record<string, unknown>)!;
      const { error } = await supabaseAdmin
        .from("store_subscriptions")
        .update({
          plan_id: pending.pending_plan_id,
          metadata: withoutPendingPlanSwitch(sub.metadata as Record<string, unknown>),
        })
        .eq("id", sub.id);
      if (!error) promoted += 1;
    }

    return { success: true, promoted };
  } catch (err) {
    console.error("promoteDuePlanSwitches failed:", err);
    return { success: false, error: err, promoted: 0 };
  }
}
