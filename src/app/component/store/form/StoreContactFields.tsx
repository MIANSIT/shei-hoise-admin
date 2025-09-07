"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Form, Input } from "antd";
import { StoreFormData } from "@/lib/utils/schemas/store/storeSchema";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreContactFields({ control, errors }: Props) {
  return (
    <>
      {/* Contact Email */}
      <Controller
        name="contact_email"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Contact Email"
            validateStatus={errors.contact_email ? "error" : ""}
            help={errors.contact_email?.message}
          >
            <Input type="email" {...field} placeholder="admin@example.com" />
          </Form.Item>
        )}
      />

      {/* Contact Phone */}
      <Controller
        name="contact_phone"
        control={control}
        render={({ field }) => (
          <Form.Item label="Contact Phone">
            <Input {...field} placeholder="+8801XXXXXXXXX" />
          </Form.Item>
        )}
      />

      {/* Business Address */}
      <Controller
        name="business_address"
        control={control}
        render={({ field }) => (
          <Form.Item label="Business Address">
            <Input.TextArea
              rows={2}
              {...field}
              placeholder="Full business address"
            />
          </Form.Item>
        )}
      />
    </>
  );
}
