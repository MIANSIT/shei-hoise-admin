"use client";

import React, { useState } from "react";
import { Steps, Button } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  storeSchema,
  StoreFormData,
} from "@/lib/utils/schemas/storeCreate/storeSchema";
import { useStoreFormStore } from "@/lib/store/storeFormStore";

import { StoreUserFields } from "./form/StoreUserFields";
import { StoreBasicInfoFields } from "./form/StoreBasicInfoFields";
import { StoreContactFields } from "./form/StoreContactFields";
import { StoreBusinessFields } from "./form/StoreBusinessFields";
import { StoreMediaFields } from "./form/StoreMediaFields";
import { StoreMetaFields } from "./form/StoreMetaFields";

const steps = [
  { title: "User Info", Component: StoreUserFields },
  { title: "Basic Info", Component: StoreBasicInfoFields },
  { title: "Contact", Component: StoreContactFields },
  { title: "Business", Component: StoreBusinessFields },
  { title: "Media", Component: StoreMediaFields },
  { title: "Meta", Component: StoreMetaFields },
];

// Step-specific fields (for trigger)
const stepFieldsMap: (keyof StoreFormData)[][] = [
  ["user_email", "first_name", "last_name", "user_phone", "password"],
  ["store_name", "store_slug", "description"],
  ["contact_email", "contact_phone", "business_address"],
  ["business_license", "tax_id", "status", "approved_by", "approved_at"],
  ["logo_url", "banner_url"],
  ["is_active"],
];

export function StoreWizard({
  onSubmit,
  loading = false,
}: {
  onSubmit: (data: StoreFormData) => void;
  loading?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const { data, setData, reset } = useStoreFormStore();

  const {
    control,
    getValues,
    trigger,
    reset: resetForm,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),

    defaultValues: { is_active: true, ...data },
    mode: "onChange",
  });

  const CurrentStep = steps[current].Component;

  const nextStep = async () => {
    const valid = await trigger(stepFieldsMap[current]);
    if (!valid) return;
    setData(getValues());
    setCurrent((prev) => prev + 1);
  };

  const prevStep = () => setCurrent((prev) => prev - 1);

  const finish = async () => {
    const valid = await trigger();
    if (!valid) return;

    const finalData = getValues();

    onSubmit(finalData);

    setData(finalData);
    resetForm();
    reset();
    setCurrent(0);
  };

  return (
    <div className="p-6 rounded-xl shadow-md">
      <Steps current={current} items={steps.map((s) => ({ title: s.title }))} />
      <div className="mt-6 space-y-6">
        <CurrentStep control={control} errors={errors} />
        <div className="flex justify-between mt-6">
          {current > 0 && <Button onClick={prevStep}>Previous</Button>}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={nextStep}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" loading={loading} onClick={finish}>
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
