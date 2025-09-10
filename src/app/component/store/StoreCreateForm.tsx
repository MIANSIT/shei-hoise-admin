"use client";

import { Form, Button } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserType, createUserSchema } from "@/lib/schema/user.schema";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";

import UserInformationForm from "./forms/UserInformationForm";
import StoreInformationForm from "./forms/StoreInformationForm";
import StoreSettingsForm from "./forms/StoreSettingsForm";

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
        terms_and_conditions: "",
        privacy_policy: "",
      },
      profile: {
        country: "Bangladesh",
      },
    },
  });

  const userType = watch("user_type");

  return (
    <div className="max-w-3xl mx-auto shadow-md rounded-2xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Create User</h2>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <UserInformationForm control={control} />

        {userType === "store_owner" && (
          <>
            <StoreInformationForm control={control} notify={notify} />
            <StoreSettingsForm control={control} notify={notify} />
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
