"use client";

import React from "react";
import { StoreFormData } from "@/lib/utils/schemas/store/storeSchema";
import { StoreForm } from "@/app/component/store/StoreForm";

export default function AdminCreateStorePage() {
  const handleCreate = async (data: StoreFormData) => {
    console.log("Form Data:", data);
    // ✅ Call your API to create store here
  };

  return (
    <div className="max-w-4xl mx-auto p-8 rounded-xl shadow-lg">
      <StoreForm onSubmit={handleCreate} submitLabel="Create Store" />
    </div>
  );
}
