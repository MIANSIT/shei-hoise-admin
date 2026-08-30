import {
  Home,
  CreditCard,
  PlusCircle,
  Store,
  ShoppingBag,
  Ticket,
  Inbox,
  LayoutList,
  BadgeCheck,
  FileText,
} from "lucide-react";
import React from "react";

// ✅ Define MenuItem type
export interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // ✅ required now
  children?: MenuItem[];
}

export const sideMenu: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },

  {
    title: "Store",
    icon: Store,
    children: [
      {
        title: "View Store",
        href: "/dashboard/store",
        icon: ShoppingBag,
      },
      {
        title: "Create Store",
        href: "/dashboard/store/create-store",
        icon: PlusCircle,
      },
    ],
  },

  {
    title: "Subscription",
    icon: BadgeCheck,
    children: [
      {
        title: "Plans",
        href: "/dashboard/subscription/plans",
        icon: LayoutList,
      },
      {
        title: "Store Subscriptions",
        href: "/dashboard/subscription/store-subscriptions",
        icon: CreditCard,
      },
      {
        title: "Invoices",
        href: "/dashboard/subscription/invoices",
        icon: FileText,
      },
    ],
  },

  {
    title: "Requests",
    icon: Ticket,
    children: [
      { title: "User Requests", href: "/dashboard/user-requests", icon: Inbox },
    ],
  },
];
