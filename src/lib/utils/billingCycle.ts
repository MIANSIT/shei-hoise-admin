import { BillingCycle } from "@/lib/types/subscription.types";

export function addBillingCycle(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  switch (cycle) {
    case BillingCycle.MONTHLY:
      end.setMonth(end.getMonth() + 1);
      break;
    case BillingCycle.HALF_YEARLY:
      end.setMonth(end.getMonth() + 6);
      break;
    case BillingCycle.YEARLY:
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  return end;
}
