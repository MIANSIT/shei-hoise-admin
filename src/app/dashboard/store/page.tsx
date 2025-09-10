"use client";

import { useEffect } from "react";
import { viewStoreOwners } from "@/lib/queries/users/viewUser";

function StoreOwnersPage() {
  useEffect(() => {
    const fetchData = async () => {
      const res = await viewStoreOwners();
      console.log("Store owners with their stores:", res);
    };
    fetchData();
  }, []);

  return <div>Store Owners Page</div>;
}

export default StoreOwnersPage;
