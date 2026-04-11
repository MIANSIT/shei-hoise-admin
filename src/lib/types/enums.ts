export enum StoreStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  TRIAL = "trial",
}
export const STORE_STATUS = {
  PENDING: StoreStatus.PENDING,
  APPROVED: StoreStatus.APPROVED,
  REJECTED: StoreStatus.REJECTED,
  TRIAL: StoreStatus.TRIAL,
} as const;
export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  [StoreStatus.PENDING]: "PENDING",
  [StoreStatus.APPROVED]: "APPROVED",
  [StoreStatus.REJECTED]: "REJECTED",
  [StoreStatus.TRIAL]: "TRIAL", // display label
};

export enum Currency {
  BDT = "BDT",
  // USD = "USD",
  // EUR = "EUR",
  // GBP = "GBP",
  // INR = "INR",
}

export const CURRENCY_ICONS: Record<Currency, string> = {
  [Currency.BDT]: "৳", // Bengali Taka symbol
  // [Currency.USD]: "$",   // US Dollar
  // [Currency.EUR]: "€",   // Euro
  // [Currency.GBP]: "£",   // British Pound
  // [Currency.INR]: "₹",   // Indian Rupee
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  [Currency.BDT]: "Taka",
  // [Currency.USD]: "US Dollar",
  // [Currency.EUR]: "Euro",
  // [Currency.GBP]: "British Pound",
  // [Currency.INR]: "Indian Rupee",
};
export const USER_TYPES = {
  //   SUPER_ADMIN: "super_admin",
  STORE_OWNER: "store_owner",
  //  STORE_OWNER = "store_owner",
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  //   CUSTOMER: "customer",
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  //   super_admin: "Super Admin",
  store_owner: "Store Owner",
  customer: "Customer",
  admin: "Admin",
  super_admin: "Super Admin",
  //   customer: "Customer",
};
