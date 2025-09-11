import {
  Home,
  Package,
  ShoppingCart,
  UserPlus,
  User,
  CreditCard,
  DollarSign,
  PlusCircle,
  Clipboard,
  BarChart2,
  FolderPlus,
  Store,
  Users,
  ShoppingBag,
  Warehouse,
  FilePlus2,
  Boxes,
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
    title: "Users",
    icon: Users,
    children: [
      { title: "All Users", href: "/account/profile", icon: User },
      { title: "Create Users", href: "/account/settings", icon: UserPlus },
    ],
  },

  {
    title: "Products",
    icon: Package,
    children: [
      {
        title: "Add Product",
        href: "/dashboard/products/add-product",
        icon: FilePlus2,
      },
      {
        title: "Stock Update",
        href: "/dashboard/products/stocks-update",
        icon: Warehouse,
      },
      { title: "All Products", href: "/dashboard/products", icon: Boxes },
      {
        title: "All Categories",
        href: "/dashboard/products/view-category",
        icon: FolderPlus,
      },
    ],
  },

  {
    title: "Orders",
    icon: ShoppingCart,
    children: [
      {
        title: "Create Order",
        href: "/dashboard/orders/create-order",
        icon: PlusCircle,
      },
      {
        title: "All Orders",
        href: "/dashboard/orders/view-order",
        icon: Clipboard,
      },
    ],
  },

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
    title: "Financial",
    icon: DollarSign,
    children: [
      { title: "Billing", href: "/financial/billing", icon: CreditCard },
      { title: "Cost", href: "/financial/cost", icon: BarChart2 },
    ],
  },
];
