// A plan switch that lands mid-period (the store paid early, while its current
// plan's period is still running) is queued here instead of applied immediately —
// applying plan_id right away would hand out the new plan's features/limits for
// days the store already paid for under the old plan. Stored in the existing
// `metadata` jsonb column so no schema change is needed; promoted to the real
// `plan_id` once `pending_plan_effective_at` arrives (see promoteDuePlanSwitches
// and the pg_cron job that calls it automatically).

export interface PendingPlanSwitch {
  pending_plan_id: string;
  pending_plan_effective_at: string;
}

export function getPendingPlanSwitch(
  metadata: Record<string, unknown> | null | undefined
): PendingPlanSwitch | null {
  const planId = metadata?.pending_plan_id;
  const effectiveAt = metadata?.pending_plan_effective_at;
  if (typeof planId === "string" && typeof effectiveAt === "string") {
    return { pending_plan_id: planId, pending_plan_effective_at: effectiveAt };
  }
  return null;
}

export function withPendingPlanSwitch(
  metadata: Record<string, unknown> | null | undefined,
  planId: string,
  effectiveAt: string
): Record<string, unknown> {
  return { ...(metadata ?? {}), pending_plan_id: planId, pending_plan_effective_at: effectiveAt };
}

export function withoutPendingPlanSwitch(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!metadata) return {};
  const { pending_plan_id, pending_plan_effective_at, ...rest } = metadata;
  void pending_plan_id;
  void pending_plan_effective_at;
  return rest;
}
