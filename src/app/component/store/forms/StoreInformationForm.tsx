import { Form, Input } from "antd";
import { Controller, Control } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";
import UploadImage from "../uploads/UploadImage";

interface StoreInformationFormProps {
  control: Control<CreateUserType>;
}

export default function StoreInformationForm({
  control,
}: StoreInformationFormProps) {
  return (
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
            render={({ field }) => <UploadImage field={field} label="Logo" />}
          />
        </Form.Item>

        <Form.Item label="Banner">
          <Controller
            name="store.banner_url"
            control={control}
            render={({ field }) => <UploadImage field={field} label="Banner" />}
          />
        </Form.Item>
      </div>

      <Form.Item label="Contact Email" required>
        <Controller
          name="store.contact_email"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item label="Contact Phone" required>
        <Controller
          name="store.contact_phone"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item label="Business Address" required>
        <Controller
          name="store.business_address"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>

      <Form.Item label="Business License" required>
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
    </>
  );
}
