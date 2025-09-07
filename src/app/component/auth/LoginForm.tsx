"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";

import { LoginFormSchema, LoginFormType } from "@/lib/schema/auth";
import { Button } from "@/app/component/ui/button";
import { Input } from "@/app/component/ui/input";
import { Label } from "@/app/component/ui/label";
import { PasswordToggle } from "../common/PasswordToggle";
import { SheiLoader } from "../ui/SheiLoader/loader";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  submitText?: string;
  theme?: "light" | "dark";
}

export function LoginForm({
  submitText = "Login",
  theme = "light",
}: LoginFormProps) {
  const { success, error } = useSheiNotification();
  const router = useRouter();
  const handleAdminLogin = async (values: LoginFormType) => {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: values.username, // we renamed username → email in schema
      password: values.password,
    });

    if (loginError) {
      error(loginError.message || "Login failed. Please try again.");
      return;
    }

    success("Login successful!");
    router.push("/dashboard");
  };

  const form = useForm<LoginFormType>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { username: "", password: "" },
    mode: "onChange",
  });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={form.handleSubmit(handleAdminLogin)}
      className='space-y-4'
      noValidate
    >
      {/* Email Field */}
      <div className='grid gap-2'>
        <Label
          htmlFor='email'
          className={theme === "dark" ? "text-gray-200" : "text-gray-800"}
        >
          Email
        </Label>
        <Input
          id='email'
          type='email'
          placeholder='Enter your email'
          {...form.register("username")}
          disabled={form.formState.isSubmitting}
          className={
            theme === "dark"
              ? "bg-gray-800 text-gray-100 border-gray-600 placeholder-gray-400"
              : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"
          }
        />
        {form.formState.errors.username && (
          <p className='text-sm text-red-500'>
            {form?.formState?.errors?.username?.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className='grid gap-2 relative'>
        <Label
          htmlFor='password'
          className={theme === "dark" ? "text-gray-200" : "text-gray-800"}
        >
          Password
        </Label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? "text" : "password"}
            placeholder='Enter your password'
            {...form.register("password")}
            disabled={form.formState.isSubmitting}
            className={
              theme === "dark"
                ? "bg-gray-800 text-gray-100 border-gray-600 placeholder-gray-400 pr-14"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-500 pr-14"
            }
          />
          <div className='absolute inset-y-0 right-2 flex items-center'>
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
        </div>
        {form.formState.errors.password && (
          <p className='text-sm text-red-500'>
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type='submit'
        variant={theme === "dark" ? "dark" : "light"}
        className='w-full mt-2 relative overflow-hidden'
        disabled={!form.formState.isValid || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <SheiLoader size='sm' loaderColor='current' />
        ) : (
          <span>{submitText}</span>
        )}
      </Button>
    </form>
  );
}
