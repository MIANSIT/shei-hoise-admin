"use client";

import { Path, useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/app/component/ui/button";
import { Input } from "@/app/component/ui/input";
import { Label } from "@/app/component/ui/label";
import { useState } from "react";
import { PasswordToggle } from "./PasswordToggle";
import { SheiLoader } from "../ui/SheiLoader/loader";
import Link from "next/link";
import { ZodObject, ZodTypeAny } from "zod";
import { DefaultValues } from "react-hook-form";

interface UserFormProps<T extends Record<string, unknown>> {
  schema: ZodObject<Record<string, ZodTypeAny>>;
  defaultValues: DefaultValues<T>;
  onSubmit: (values: T) => Promise<void>;
  hiddenFields?: Partial<Record<keyof T, boolean>>;
  footer?: {
    text?: string;
    linkText?: string;
    linkUrl?: string;
  };
  submitText: string;
  theme: "light" | "dark";
}

export function UserForm<T extends Record<string, unknown>>({
  defaultValues,
  onSubmit,
  hiddenFields = {},
  footer,
  submitText,
  theme,
}: UserFormProps<T>) {
  const form = useForm<T>({
    defaultValues,
    mode: "onChange",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit: SubmitHandler<T> = async (values) => {
    try {
      await onSubmit(values);
      form.reset();
    } finally {
      // react-hook-form sets isSubmitting automatically
    }
  };

  const renderError = (fieldName: keyof T) =>
    form.formState.errors[fieldName as Path<T>] ? (
      <p
        className={`text-sm mt-1 ${
          theme === "dark" ? "text-red-400" : "text-red-600"
        }`}
      >
        {form.formState.errors[fieldName as Path<T>]?.message as string}
      </p>
    ) : null;

  const renderField = (key: keyof T) => {
    if (hiddenFields[key]) return null;

    const isPassword = key === "password" || key === "confirmPassword";
    const label = String(key)
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

    return (
      <div key={String(key)} className="grid gap-2 relative">
        <Label
          htmlFor={String(key)}
          className={theme === "dark" ? "text-gray-200" : "text-gray-800"}
        >
          {label}
        </Label>
        <div className={isPassword ? "relative" : ""}>
          <Input
            {...form.register(key as Path<T>)}
            placeholder={label}
            type={isPassword ? (showPassword ? "text" : "password") : "text"}
            disabled={form.formState.isSubmitting}
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-gray-100 border-gray-600 placeholder-gray-400"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"
            } ${isPassword ? "pr-14" : ""}`}
          />
          {isPassword && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              <PasswordToggle
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
          )}
        </div>
        {renderError(key)}
      </div>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {Object.keys(defaultValues).map((key) => renderField(key as keyof T))}

      <Button
        type="submit"
        variant={theme === "dark" ? "dark" : "light"} // ✅ Theme-aware
        size="default"
        className="w-full mt-2 relative overflow-hidden"
        disabled={!form.formState.isValid || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <SheiLoader size="sm" loaderColor="current" />
        ) : (
          <span>{submitText}</span>
        )}
      </Button>

      {footer?.text && footer?.linkText && footer?.linkUrl && (
        <p
          className={`text-sm text-center mt-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {footer.text}{" "}
          <Link
            href={footer.linkUrl}
            className={`${
              theme === "dark"
                ? "text-blue-400 hover:underline"
                : "text-blue-600 hover:underline"
            }`}
          >
            {footer.linkText}
          </Link>
        </p>
      )}
    </form>
  );
}
