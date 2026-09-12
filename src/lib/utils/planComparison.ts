import { SubscriptionPlan } from "@/lib/types/subscription.types";

// The set of plans worth showing a prospective store owner — active and
// publicly offered. Private/trial/inactive plans (e.g. a default trial plan
// or a one-off custom deal) are deliberately excluded from any comparison.
export function getComparablePlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return [...plans]
    .filter((p) => p.is_public && p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.price_monthly - b.price_monthly);
}

// Every feature key switched on for at least one of the given plans, in
// first-seen order — so the comparison table only ever shows rows that are
// actually configured, and picks up new keys automatically.
export function getComparisonFeatureKeys(plans: SubscriptionPlan[]): string[] {
  return Array.from(
    new Set(
      plans.flatMap((p) => Object.entries(p.features).filter(([, v]) => !!v).map(([k]) => k))
    )
  );
}

// Every limit key defined on at least one of the given plans.
export function getComparisonLimitKeys(plans: SubscriptionPlan[]): string[] {
  return Array.from(new Set(plans.flatMap((p) => Object.keys(p.limits))));
}

export function yearlySavingsPct(monthly: number, yearly: number): number {
  const equiv = monthly * 12;
  return equiv > 0 && yearly > 0 ? Math.round((1 - yearly / equiv) * 100) : 0;
}
