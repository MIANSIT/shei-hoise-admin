import { Form, InputNumber, Input, Switch } from "antd";
import { Controller, Control } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";

const { TextArea } = Input;

interface StoreSettingsFormProps {
  control: Control<CreateUserType>;
}

export default function StoreSettingsForm({ control }: StoreSettingsFormProps) {
  return (
    <>
      <h3 className="text-lg font-medium mt-6 mb-2">Store Settings</h3>

      <Form.Item label="Currency">
        <Input value="BDT" readOnly />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item label="Tax Rate (%)">
          <Controller
            name="store_settings.tax_rate"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} className="w-full" />
            )}
          />
        </Form.Item>

        <Form.Item label="Shipping Fee">
          <Controller
            name="store_settings.shipping_fee"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} className="w-full" />
            )}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Form.Item label="Processing Time (days)">
          <Controller
            name="store_settings.processing_time_days"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={1} className="w-full" />
            )}
          />
        </Form.Item>

        <Form.Item label="Return Policy Days">
          <Controller
            name="store_settings.return_policy_days"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} className="w-full" />
            )}
          />
        </Form.Item>

        <Form.Item label="Is Active">
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value ?? true} onChange={field.onChange} />
            )}
          />
        </Form.Item>
      </div>

      {/* Terms & Privacy Policy as TextArea */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Form.Item label="Terms & Conditions">
          <Controller
            name="store_settings.terms_and_conditions"
            control={control}
            render={({ field }) => (
              <TextArea {...field} rows={4} placeholder="Enter Terms & Conditions" />
            )}
          />
        </Form.Item>

        <Form.Item label="Privacy Policy">
          <Controller
            name="store_settings.privacy_policy"
            control={control}
            render={({ field }) => (
              <TextArea {...field} rows={4} placeholder="Enter Privacy Policy" />
            )}
          />
        </Form.Item>
      </div>
    </>
  );
}
