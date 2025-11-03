import { Form, InputNumber, Input, Switch, Select, Button, Space } from "antd";
import { Controller, Control, useFieldArray } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

interface StoreSettingsFormProps {
  control: Control<CreateUserType>;
}

const shippingOptions = ["Inside Dhaka", "Outside Dhaka"] as const;

export default function StoreSettingsForm({ control }: StoreSettingsFormProps) {
  // Dynamic shipping fees array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "store_settings.shipping_fees",
  });

  // Track selected locations to hide them from dropdown
  const selectedOptions = fields.map((f) => f.location);

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

        <Form.Item label="Min Order Amount">
          <Controller
            name="store_settings.min_order_amount"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} className="w-full" />
            )}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
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

      {/* Shipping Fees */}
      <h3 className="text-lg font-medium mt-6 mb-2">Shipping Fees</h3>
      {fields.map((field, index) => (
        <Form.Item
          key={field.id}
          label={
            field.location
              ? `Shipping Fee (${field.location})`
              : `Shipping Fee ${index + 1}`
          }
        >
          <Space>
            <Controller
              name={`store_settings.shipping_fees.${index}.location`}
              control={control}
              rules={{ required: true }} // ✅ must select location
              render={({ field: controllerField }) => (
                <Select
                  {...controllerField}
                  placeholder="Select Location"
                  style={{ width: 150 }}
                  value={
                    controllerField.value as
                      | (typeof shippingOptions)[number]
                      | undefined
                  }
                >
                  {shippingOptions
                    .filter(
                      (option) =>
                        !selectedOptions.includes(option) ||
                        option === controllerField.value
                    )
                    .map((option) => (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    ))}
                </Select>
              )}
            />

            <Controller
              name={`store_settings.shipping_fees.${index}.fee`}
              control={control}
              rules={{ required: true, min: 0 }} // ✅ must enter fee
              render={({ field: feeField }) => (
                <InputNumber
                  {...feeField}
                  min={0}
                  placeholder="Enter Fee"
                  style={{ width: 120 }}
                />
              )}
            />

            {/* Hide minus button if only one row */}
            {fields.length > 1 && (
              <Button
                type="text"
                icon={<MinusOutlined />}
                onClick={() => remove(index)}
              />
            )}
          </Space>
        </Form.Item>
      ))}

      {/* Add button */}
      {fields.length < 2 && (
        <Form.Item>
          <Button
            type="dashed"
            onClick={() => {
              const availableLocation = shippingOptions.find(
                (option) => !selectedOptions.includes(option)
              );
              if (availableLocation) {
                append({ location: availableLocation, fee: 0 });
              }
            }}
            icon={<PlusOutlined />}
          >
            Add Shipping Fee
          </Button>
        </Form.Item>
      )}

      {/* Terms & Privacy Policy */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Form.Item label="Terms & Conditions">
          <Controller
            name="store_settings.terms_and_conditions"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                placeholder="Enter Terms & Conditions"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Privacy Policy">
          <Controller
            name="store_settings.privacy_policy"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={4}
                placeholder="Enter Privacy Policy"
              />
            )}
          />
        </Form.Item>
      </div>
    </>
  );
}
