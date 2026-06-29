export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  EXPIRED = "expired",
  PAUSED = "paused",
  INCOMPLETE = "incomplete",
}

export enum BillingCycle {
  MONTHLY = "monthly",
  HALF_YEARLY = "half-yearly",
  YEARLY = "yearly",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIALING]: "Trialing",
  [SubscriptionStatus.ACTIVE]: "Active",
  [SubscriptionStatus.PAST_DUE]: "Past Due",
  [SubscriptionStatus.CANCELED]: "Canceled",
  [SubscriptionStatus.EXPIRED]: "Expired",
  [SubscriptionStatus.PAUSED]: "Paused",
  [SubscriptionStatus.INCOMPLETE]: "Incomplete",
};

export const SUBSCRIPTION_STATUS_COLORS: Record<
  SubscriptionStatus,
  { bg: string; text: string; dot: string }
> = {
  [SubscriptionStatus.ACTIVE]: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  [SubscriptionStatus.TRIALING]: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  [SubscriptionStatus.PAST_DUE]: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  [SubscriptionStatus.CANCELED]: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  [SubscriptionStatus.EXPIRED]: {
    bg: "bg-slate-100 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  [SubscriptionStatus.PAUSED]: {
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  [SubscriptionStatus.INCOMPLETE]: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-500",
  },
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  [BillingCycle.MONTHLY]: "Monthly",
  [BillingCycle.HALF_YEARLY]: "Half Yearly",
  [BillingCycle.YEARLY]: "Yearly",
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  trial_days: number;
  is_active: boolean;
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  started_at: string;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  canceled_at?: string | null;
  cancels_at_period_end: boolean;
  current_period_start: string;
  current_period_end?: string | null;
  payment_provider?: string | null;
  payment_provider_customer_id?: string | null;
  payment_provider_subscription_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  stores?: {
    id: string;
    store_name: string;
    store_slug: string;
    owner?: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  subscription_plans?: {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
  } | null;
}

export interface SimpleStore {
  id: string;
  store_name: string;
  store_slug: string;
  owner_id: string;
}

export type CreatePlanInput = {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  currency?: string;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  trial_days?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_public?: boolean;
  sort_order?: number;
};

export type CreateStoreSubscriptionInput = {
  store_id: string;
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  started_at?: string;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  current_period_start?: string;
  current_period_end?: string | null;
  payment_provider?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateStoreSubscriptionInput = Partial<{
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  cancels_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string | null;
  payment_provider: string | null;
  payment_provider_customer_id: string | null;
  payment_provider_subscription_id: string | null;
  metadata: Record<string, unknown>;
}>;
