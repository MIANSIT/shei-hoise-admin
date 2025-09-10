"use client";

import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button, Form, InputNumber, Select, Upload, Switch } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { CreateUserType, createUserSchema } from "@/lib/schema/user.schema";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";

interface StoreCreateFormProps {
  onSubmit: (data: CreateUserType) => void;
  loading?: boolean;
}

export default function StoreCreateForm({
  onSubmit,
  loading = false,
}: StoreCreateFormProps) {
  const notify = useSheiNotification();

  const { control, handleSubmit, watch } = useForm<CreateUserType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      user_type: "store_owner",
      is_active: true,
      store: {
        store_name: "",
        store_slug: "",
        description: "",
        contact_email: "",
        contact_phone: "",
        business_address: "",
        business_license: "",
        tax_id: "",
        logo_url: "",
        banner_url: "",
      },
      store_settings: {
        currency: "BDT",
        tax_rate: 0,
        shipping_fee: 0,
        min_order_amount: 0,
        processing_time_days: 1,
        return_policy_days: 7,
      },
      profile: {
        country: "Bangladesh",
      },
    },
  });

  const userType = watch("user_type");

  // 🔹 Image Upload Renderer without Supabase
  const renderImageUpload = (
    field: ControllerRenderProps<
      CreateUserType,
      "store.logo_url" | "store.banner_url"
    >,
    label: string
  ) => {
    const fileList: UploadFile[] = field.value
      ? [{ uid: "-1", name: label, status: "done", url: field.value }]
      : [];

    return (
      <Upload
        listType="picture-card"
        fileList={fileList}
        onRemove={() => field.onChange(undefined)}
        customRequest={async ({ file, onSuccess, onError }) => {
          try {
            const reader = new FileReader();
            reader.readAsDataURL(file as RcFile);

            reader.onload = () => {
              const result = reader.result as string;
              field.onChange(result); // set base64 string
              if (onSuccess) onSuccess({ url: result }, file as RcFile);
            };

            reader.onerror = () => {
              const error = new Error("File reading failed");
              notify.error(error.message);
              if (onError) onError(error);
            };
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error("Upload failed");
            notify.error(error.message);
            if (onError) onError(error);
          }
        }}
      >
        {fileList.length >= 1 ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
    );
  };

  return (
    <div className="max-w-3xl mx-auto shadow-md rounded-2xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Create User</h2>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* User Info */}
        <h3 className="text-lg font-medium mt-4 mb-2">User Information</h3>

        <Form.Item label="User Type" required>
          <Controller
            name="user_type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { label: "Super Admin", value: "super_admin" },
                  { label: "Store Owner", value: "store_owner" },
                  { label: "Customer", value: "customer" },
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Email" required>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>

        <Form.Item label="Password" required>
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} />}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="First Name" required>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item label="Last Name" required>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
        </div>

        <Form.Item label="Phone">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>

        <Form.Item label="Country">
          <Controller
            name="profile.country"
            control={control}
            render={({ field }) => <Input {...field} readOnly />}
          />
        </Form.Item>

        {/* Store Info */}
        {userType === "store_owner" && (
          <>
            <h3 className="text-lg font-medium mt-6 mb-2">Store Information</h3>

            <Form.Item label="Store Name" required>
              <Controller
                name="store.store_name"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Store Slug" required>
              <Controller
                name="store.store_slug"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Description">
              <Controller
                name="store.description"
                control={control}
                render={({ field }) => <Input.TextArea {...field} />}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Logo">
                <Controller
                  name="store.logo_url"
                  control={control}
                  render={({ field }) => renderImageUpload(field, "Logo")}
                />
              </Form.Item>

              <Form.Item label="Banner">
                <Controller
                  name="store.banner_url"
                  control={control}
                  render={({ field }) => renderImageUpload(field, "Banner")}
                />
              </Form.Item>
            </div>

            <Form.Item label="Contact Email">
              <Controller
                name="store.contact_email"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Contact Phone">
              <Controller
                name="store.contact_phone"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Business Address">
              <Controller
                name="store.business_address"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Business License">
              <Controller
                name="store.business_license"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            <Form.Item label="Tax ID">
              <Controller
                name="store.tax_id"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Form.Item>

            {/* Store Settings */}
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

            <div className="grid grid-cols-2 gap-4">
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
              {/* Active Switch */}
              <Form.Item label="Is Active">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value ?? true} // ✅ fallback to true if undefined
                      onChange={field.onChange}
                    />
                  )}
                />
              </Form.Item>
            </div>
          </>
        )}

        <Button
          type="primary"
          htmlType="submit"
          className="mt-4 w-full"
          loading={loading}
        >
          Create User
        </Button>
      </Form>
    </div>
  );
}
