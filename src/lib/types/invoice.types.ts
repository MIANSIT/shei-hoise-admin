import { BillingCycle } from "./subscription.types";

export type InvoiceStatus = "unpaid" | "submitted" | "paid" | "cancelled" | "refunded";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Unpaid",
  submitted: "Submitted",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const INVOICE_STATUS_COLORS: Record<
  InvoiceStatus,
  { bg: string; text: string; dot: string }
> = {
  unpaid: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  submitted: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  paid: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-slate-100 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  refunded: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    dot: "bg-purple-500",
  },
};

export interface SubscriptionInvoice {
  id: string;
  invoice_number: string;
  subscription_id: string;
  store_id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  status: InvoiceStatus;
  period_start: string;
  period_end: string;
  due_date: string;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  sender_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // joined
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
  } | null;
  store_subscriptions?: {
    current_period_end: string | null;
  } | null;
}

export interface CreateInvoiceInput {
  subscription_id: string;
  store_id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  period_start: string;
  period_end: string;
  due_date: string;
  notes?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  paid_at?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  amount?: number;
  due_date?: string;
  period_start?: string;
  period_end?: string;
}
