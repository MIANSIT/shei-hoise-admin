"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Form, Input } from "antd";
import { StoreFormData } from "@/lib/utils/schemas/store/storeSchema";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreBusinessFields({ control }: Props) {
  return (
    <>
      {/* Business License */}
      <Controller
        name="business_license"
        control={control}
        render={({ field }) => (
          <Form.Item label="Business License">
            <Input {...field} placeholder="Business license number" />
          </Form.Item>
        )}
      />

      {/* Tax ID */}
      <Controller
        name="tax_id"
        control={control}
        render={({ field }) => (
          <Form.Item label="Tax ID">
            <Input {...field} placeholder="Tax identification number" />
          </Form.Item>
        )}
      />
    </>
  );
}
