"use server";

import { getStoreSubscriptions } from "./getStoreSubscriptions";
import { getSubscriptionPlans } from "../plans/getPlans";
import { getAllStoresForDropdown } from "../getAllStores";

// Server actions called from the client run one at a time, so three separate
// calls cost three round trips back to back. One bundled action runs the
// queries in parallel on the server instead.
export async function getStoreSubscriptionsPageData() {
  const [subs, plans, stores] = await Promise.all([
    getStoreSubscriptions(),
    getSubscriptionPlans(),
    getAllStoresForDropdown(),
  ]);
  return { subs, plans, stores };
}
