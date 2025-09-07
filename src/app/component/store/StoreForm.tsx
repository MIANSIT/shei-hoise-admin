"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import {
  storeSchema,
  StoreFormData,
} from "@/lib/utils/schemas/store/storeSchema";

// field groups
import { StoreBasicInfoFields } from "./form/StoreBasicInfoFields";
import { StoreContactFields } from "./form/StoreContactFields";
import { StoreBusinessFields } from "./form/StoreBusinessFields";
import { StoreMediaFields } from "./form/StoreMediaFields";
import { StoreMetaFields } from "./form/StoreMetaFields";

interface StoreFormProps {
  defaultValues?: Partial<StoreFormData>;
  onSubmit: (data: StoreFormData) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function StoreForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = "Save",
}: StoreFormProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      status: "pending",
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <StoreBasicInfoFields control={control} errors={errors} />
      <StoreMetaFields control={control} errors={errors} />
      <StoreContactFields control={control} errors={errors} />
      <StoreBusinessFields control={control} errors={errors} />
      <StoreMediaFields control={control} errors={errors} />

      <div className="pt-4">
        <Button
          type="primary"
          htmlType="submit"
          className="w-full md:w-auto px-8 py-2"
          loading={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
