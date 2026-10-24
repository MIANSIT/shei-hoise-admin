import { BillingCycle } from "@/lib/types/subscription.types";

export const CYCLE_MONTHS: Record<
  Exclude<BillingCycle, BillingCycle.CUSTOM>,
  number
> = {
  [BillingCycle.MONTHLY]: 1,
  [BillingCycle.HALF_YEARLY]: 6,
  [BillingCycle.YEARLY]: 12,
};

export function cycleMonths(cycle: BillingCycle, customMonths?: number): number {
  if (cycle === BillingCycle.CUSTOM) return customMonths && customMonths > 0 ? customMonths : 1;
  return CYCLE_MONTHS[cycle];
}

export function addBillingCycle(start: Date, cycle: BillingCycle, customMonths?: number): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + cycleMonths(cycle, customMonths));
  return end;
}

// Length of a stored period in whole months — used to recover a "custom" cycle's
// month count later on (e.g. at pay-time), since only period_start/period_end persist.
export function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, Math.round(months));
}

// Price for a billing cycle. Half-yearly/yearly use an explicit admin-set price when
// present (so a plan can carry a genuine discount, not just monthly x N); custom
// durations always multiply the monthly rate since there's no fixed price for them.
export function calcCycleAmount(
  plan: { price_monthly: number; price_yearly: number; price_half_yearly?: number | null },
  cycle: BillingCycle,
  customMonths?: number
): number {
  if (cycle === BillingCycle.YEARLY) return plan.price_yearly || plan.price_monthly * 12;
  if (cycle === BillingCycle.HALF_YEARLY) return plan.price_half_yearly || plan.price_monthly * 6;
  if (cycle === BillingCycle.CUSTOM) return plan.price_monthly * cycleMonths(cycle, customMonths);
  return plan.price_monthly;
}
