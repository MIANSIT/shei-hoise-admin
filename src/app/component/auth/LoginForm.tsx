"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { LoginFormSchema, LoginFormType } from "@/lib/schema/auth";
import { Button } from "@/app/component/ui/button";
import { Input } from "@/app/component/ui/input";
import { Label } from "@/app/component/ui/label";
import { PasswordToggle } from "../common/PasswordToggle";
import { SheiLoader } from "../ui/SheiLoader/loader";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { USER_TYPES } from "@/lib/types/enums";

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
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: values.username, // we renamed username → email in schema
      password: values.password,
    });

    if (loginError) {
      error(loginError.message || "Login failed. Please try again.");
      return;
    }

    // This panel is super-admin only. Credentials being valid isn't enough —
    // store owners and customers share the same auth pool, so drop the session
    // again unless the account is actually a super admin.
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || profile?.user_type !== USER_TYPES.SUPER_ADMIN) {
      await supabase.auth.signOut();
      error("This account doesn't have admin access.");
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

  const {
    handleSubmit,
    formState: { errors },
  } = form;

  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={handleSubmit(handleAdminLogin)}
      className="space-y-4"
      noValidate
    >
      {/* Email Field */}
      <div className="grid gap-2">
        <Label htmlFor="email" className="font-bold">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...form.register("username")}
          disabled={form.formState.isSubmitting}
          className={
            theme === "dark"
              ? "  border-gray-600 placeholder-gray-400"
              : "  border-gray-300 placeholder-gray-500"
          }
        />
        {form.formState.errors.username && (
          <p className="text-sm text-red-500">{errors?.username?.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="grid gap-2 relative">
        <Label htmlFor="password" className="font-bold">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...form.register("password")}
            disabled={form.formState.isSubmitting}
            className={
              theme === "dark"
                ? " border-gray-600 placeholder-gray-400 pr-14"
                : " text-gray-900 border-gray-300 placeholder-gray-500 pr-14"
            }
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant={theme === "dark" ? "dark" : "light"}
        className="w-full mt-2 relative overflow-hidden"
        disabled={!form.formState.isValid || form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <SheiLoader size="sm" loaderColor="current" />
        ) : (
          <span>{submitText}</span>
        )}
      </Button>
    </form>
  );
}
