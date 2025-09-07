"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Form, Input, Checkbox } from "antd";
import { StoreFormData } from "@/lib/utils/schemas/store/storeSchema";

const { TextArea } = Input;

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreMetaFields({ control }: Props) {
  return (
    <>
      {/* Description */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Form.Item label="Description">
            <TextArea rows={3} {...field} placeholder="Store description" />
          </Form.Item>
        )}
      />

      {/* Active */}
      <Controller
        name="is_active"
        control={control}
        render={({ field }) => (
          <Form.Item className="flex items-center mt-2">
            <Checkbox
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            >
              Active
            </Checkbox>
          </Form.Item>
        )}
      />
    </>
  );
}
