"use client";

import { Controller, Control } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";
import { FormItemWrapper } from "./FormItemWrapper";
import { RichTextController } from "./RichTextController";
import { Form } from "antd";

interface Props {
  control: Control<CreateUserType>;
}

export default function TermsPrivacy({ control }: Props) {
  return (
    <>
      <div className="space-y-8">
        {/* Option 1: Use vertical layout form */}
        <Form layout="vertical">
          <FormItemWrapper
            label="Terms & Conditions"
            required
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Controller
              name="store_settings.terms_and_conditions"
              control={control}
              render={({ field }) => (
                <RichTextController
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItemWrapper>

          <FormItemWrapper
            label="Privacy Policy"
            required
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Controller
              name="store_settings.privacy_policy"
              control={control}
              render={({ field }) => (
                <RichTextController
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItemWrapper>
        </Form>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mt-6">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Please ensure your terms
            & conditions and privacy policy are comprehensive and comply with
            local regulations.
          </p>
        </div>
      </div>
    </>
  );
}
