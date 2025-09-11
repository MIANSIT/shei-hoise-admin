import { Form, Input, Select } from "antd";
import { Controller, Control } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";

interface UserInformationFormProps {
  control: Control<CreateUserType>;
}

export default function UserInformationForm({
  control,
}: UserInformationFormProps) {
  return (
    <>
      <h3 className="text-lg font-medium mt-4 mb-2">User Information</h3>

      <Form.Item label="User Type" required>
        <Controller
          name="user_type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={[{ label: "Store Owner", value: "store_owner" }]}
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

      <Form.Item label="Phone" required>
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
    </>
  );
}
