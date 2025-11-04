"use client";

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
  const { fields, append, remove } = useFieldArray({
    control,
    name: "store_settings.shipping_fees",
  });

  const selectedOptions = fields.map((f) => f.name); // Changed from location to name

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
      {fields.map((field, index) => {
        const isDropdown = index < 2;

        return (
          <Form.Item
            key={field.id}
            label={
              field.name // Changed from location to name
                ? `Shipping Fee (${field.name})` // Changed from location to name
                : `Shipping Fee ${index + 1}`
            }
          >
            <Space>
              {/* Name */}
              <Controller
                name={`store_settings.shipping_fees.${index}.name`} // Changed from location to name
                control={control}
                rules={{
                  required: "Name is required", // Changed from location to name
                }}
                render={(
                  { field: nameField } // Changed from locationField to nameField
                ) =>
                  isDropdown ? (
                    <Select
                      {...nameField} // Changed from locationField to nameField
                      placeholder="Select Location"
                      style={{ width: 150 }}
                      value={nameField.value as string | undefined} // Changed from locationField to nameField
                    >
                      {shippingOptions
                        .filter(
                          (option) =>
                            !selectedOptions.includes(option) ||
                            option === nameField.value // Changed from locationField to nameField
                        )
                        .map((option) => (
                          <Option key={option} value={option}>
                            {option}
                          </Option>
                        ))}
                    </Select>
                  ) : (
                    <Input
                      {...nameField} // Changed from locationField to nameField
                      placeholder="Enter Location Name"
                      style={{ width: 150 }}
                    />
                  )
                }
              />

              {/* Price */}
              <Controller
                name={`store_settings.shipping_fees.${index}.price`} // Changed from fee to price
                control={control}
                render={(
                  { field: priceField } // Changed from feeField to priceField
                ) => (
                  <InputNumber
                    {...priceField} // Changed from feeField to priceField
                    min={0}
                    placeholder="Enter Price"
                    style={{ width: 120 }}
                  />
                )}
              />

              {fields.length > 1 && (
                <Button
                  type="text"
                  icon={<MinusOutlined />}
                  onClick={() => remove(index)}
                />
              )}
            </Space>
          </Form.Item>
        );
      })}

      {/* Add button */}
      <Form.Item>
        <Button
          type="dashed"
          onClick={() => {
            if (fields.length < 2) {
              // first two rows: pick available dropdown option
              const availableLocation = shippingOptions.find(
                (option) => !selectedOptions.includes(option)
              );
              if (availableLocation) {
                append({ name: availableLocation, price: 0 }); // Changed from location to name, fee to price
              }
            } else {
              // after 2 rows: allow custom location name
              append({ name: "", price: 0 }); // Changed from location to name, fee to price
            }
          }}
          icon={<PlusOutlined />}
        >
          Add Shipping Fee
        </Button>
      </Form.Item>

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
