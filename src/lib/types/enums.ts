export const USER_TYPES = {
  //   SUPER_ADMIN: "super_admin",
  STORE_OWNER: "store_owner",
  //   CUSTOMER: "customer",
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  //   super_admin: "Super Admin",
  store_owner: "Store Owner",
  //   customer: "Customer",
};
export const STORE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  SUSPENDED: "suspended",
  TRIAL: "trial",
} as const;

export type StoreStatus = (typeof STORE_STATUS)[keyof typeof STORE_STATUS];

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  pending: "Pending Approval",
  approved: "Approved",
  suspended: "Suspended",
  trial: "Trial",
};