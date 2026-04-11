import { StoreStatus } from "@/lib/types/enums";
import { TrialCountdown } from "@/lib/types/store/storeOwner.types";

export const TRIAL_DAYS = 7;

/**
 * Computes trial countdown from store's created_at.
 * Only meaningful when store.status === StoreStatus.TRIAL.
 * Returns null if createdAt is missing or invalid.
 */
export function getTrialCountdown(createdAt?: string): TrialCountdown | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return null;

  const now    = Date.now();
  const msLeft = created + TRIAL_DAYS * 86_400_000 - now;

  if (msLeft <= 0) {
    return { phase: "overdue", daysOver: Math.floor(-msLeft / 86_400_000) };
  }

  const daysLeft  = Math.floor(msLeft / 86_400_000);
  const hoursLeft = Math.floor((msLeft % 86_400_000) / 3_600_000);
  const pct       = Math.max(0, Math.min(100, (msLeft / (TRIAL_DAYS * 86_400_000)) * 100));

  if (daysLeft < 1)  return { phase: "critical", daysLeft, hoursLeft, pct };
  if (daysLeft <= 3) return { phase: "warning",  daysLeft, hoursLeft, pct };
  return               { phase: "healthy",  daysLeft, hoursLeft, pct };
}

/**
 * Returns true if a store is in an active trial (status=TRIAL and not overdue)
 */
export function isActiveTrial(status?: string, createdAt?: string): boolean {
  if (status !== StoreStatus.TRIAL) return false;
  const c = getTrialCountdown(createdAt);
  return c !== null && c.phase !== "overdue";
}

/**
 * Returns true if a store trial is in critical phase (<24h left)
 */
export function isTrialCritical(status?: string, createdAt?: string): boolean {
  if (status !== StoreStatus.TRIAL) return false;
  const c = getTrialCountdown(createdAt);
  return c !== null && c.phase === "critical";
}