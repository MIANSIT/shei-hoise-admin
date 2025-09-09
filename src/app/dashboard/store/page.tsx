"use client";

import { getUsers } from "@/lib/queries/users/viewUser";
import React, { useEffect } from "react";

function StorePage() {
  const fetchUsers = async () => {
    const data = await getUsers();
    console.log(data);
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  return <div>page</div>;
}

export default StorePage;
