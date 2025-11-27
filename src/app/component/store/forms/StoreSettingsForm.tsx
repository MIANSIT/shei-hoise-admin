"use client";

import { Form, InputNumber, Input, Switch, Select, Button, Space } from "antd";
import { Controller, Control, useFieldArray } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { useMemo, useRef } from "react";
import JoditEditor from "jodit-react";

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

  const selectedOptions = fields.map((f) => f.name);

  // Jodit editor configuration with proper TypeScript types
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
      height: 300,
      toolbarAdaptive: false,
      toolbarButtonSize: "middle" as const,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "left",
        "center",
        "right",
        "justify",
        "|",
        "hr",
        "|",
        "link",
        "|",
        "undo",
        "redo",
        "|",
        "preview",
      ],
      removeButtons: ["source", "about"],
      useSearch: false,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
    }),
    []
  );

  const termsEditorRef = useRef(null);
  const privacyEditorRef = useRef(null);

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
              field.name
                ? `Shipping Fee (${field.name})`
                : `Shipping Fee ${index + 1}`
            }
          >
            <Space>
              {/* Name */}
              <Controller
                name={`store_settings.shipping_fees.${index}.name`}
                control={control}
                rules={{
                  required: "Name is required",
                }}
                render={({ field: nameField }) =>
                  isDropdown ? (
                    <Select
                      {...nameField}
                      placeholder="Select Location"
                      style={{ width: 150 }}
                      value={nameField.value as string | undefined}
                    >
                      {shippingOptions
                        .filter(
                          (option) =>
                            !selectedOptions.includes(option) ||
                            option === nameField.value
                        )
                        .map((option) => (
                          <Option key={option} value={option}>
                            {option}
                          </Option>
                        ))}
                    </Select>
                  ) : (
                    <Input
                      {...nameField}
                      placeholder="Enter Location Name"
                      style={{ width: 150 }}
                    />
                  )
                }
              />

              {/* Price */}
              <Controller
                name={`store_settings.shipping_fees.${index}.price`}
                control={control}
                render={({ field: priceField }) => (
                  <InputNumber
                    {...priceField}
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
              const availableLocation = shippingOptions.find(
                (option) => !selectedOptions.includes(option)
              );
              if (availableLocation) {
                append({ name: availableLocation, price: 0 });
              }
            } else {
              append({ name: "", price: 0 });
            }
          }}
          icon={<PlusOutlined />}
        >
          Add Shipping Fee
        </Button>
      </Form.Item>

      {/* Terms & Privacy Policy with Jodit Editor */}
        <h3 className="text-lg font-medium mt-6 mb-2">Terms & Privacy</h3>
      <div className="grid grid-cols-1 gap-6 mt-4">
        <Form.Item label="Terms & Conditions" className="rich-editor-item ">
          <Controller
            name="store_settings.terms_and_conditions"
            control={control}
            render={({ field }) => (
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <JoditEditor
                  ref={termsEditorRef}
                  value={field.value || ""}
                  config={editorConfig}
                  onBlur={(newContent) => field.onChange(newContent)}
                />
              </div>
            )}
          />
        </Form.Item>

        <Form.Item label="Privacy Policy" className="rich-editor-item">
          <Controller
            name="store_settings.privacy_policy"
            control={control}
            render={({ field }) => (
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <JoditEditor
                  ref={privacyEditorRef}
                  value={field.value || ""}
                  config={editorConfig}
                  onBlur={(newContent) => field.onChange(newContent)}
                />
              </div>
            )}
          />
        </Form.Item>
      </div>

      {/* Minimal CSS - only essential styles */}
      <style jsx global>{`
        .rich-editor-item .jodit-container {
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }
        .rich-editor-item .jodit-toolbar__box {
          border-bottom: 1px solid #d9d9d9;
        }
        .rich-editor-item .jodit-wysiwyg {
          min-height: 200px;
          padding: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        }

        /* Force show bullets and numbers if still not visible */
        .rich-editor-item .jodit-wysiwyg ul {
          list-style-type: disc !important;
          padding-left: 20px !important;
        }

        .rich-editor-item .jodit-wysiwyg ol {
          list-style-type: decimal !important;
          padding-left: 20px !important;
        }

        .jodit-toolbar__box .jodit-ui-group {
          margin-bottom: 0;
        }
      `}</style>
    </>
  );
}
