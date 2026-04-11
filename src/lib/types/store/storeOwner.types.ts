import { UserWithRelationsType } from "@/lib/schema/user.types";
import { StoreStatus } from "@/lib/types/enums";

/**
 * Extends the base store type with fields returned by viewStoreOwners query
 * but not present in the Zod-derived CreateUserType
 */
export type StoreWithTrial = NonNullable<UserWithRelationsType["stores"]>[number] & {
  created_at?: string;
  status?: StoreStatus;
};

export type FilterType = "all" | "active" | "inactive" | "pending" | "approved" | "rejected" | "trial";

export type TrialCountdown =
  | { phase: "healthy";  daysLeft: number; hoursLeft: number; pct: number }
  | { phase: "warning";  daysLeft: number; hoursLeft: number; pct: number }
  | { phase: "critical"; daysLeft: number; hoursLeft: number; pct: number }
  | { phase: "overdue";  daysOver: number };