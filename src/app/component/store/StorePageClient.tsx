"use client";

import { StoreWizard } from "@/app/component/store/StoreWizard";
import { StoreFormData } from "@/lib/utils/schemas/storeCreate/storeSchema";

export default function StorePageClient() {
  const handleSubmit = async (data: StoreFormData) => {
    console.log("Final Data:", data);

    // Example API call
    // await fetch("/api/store", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
  };

  return <StoreWizard onSubmit={handleSubmit} />;
}
