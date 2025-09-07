"use client";

import { useEffect } from "react";
import { UserForm } from "../common/UserForm";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { useAuthStore } from "@/lib/store/authStore";
import {
  LoginFormValues,
  loginSchema,
} from "@/lib/utils/schemas/auth/login.schema";
import { useTheme } from "@/lib/context/ThemeContext"; // ✅ import the theme hook

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useSheiNotification();
  const { isAdminLoggedIn, hydrated, checkAuth } = useAuthStore();
  const { theme } = useTheme(); // ✅ get the current theme

  useEffect(() => {
    const verify = async () => {
      if (!hydrated) await checkAuth();
      if (hydrated && isAdminLoggedIn) router.replace("/dashboard");
    };
    verify();
  }, [hydrated, isAdminLoggedIn, checkAuth, router]);

  const handleAdminLogin = async (values: LoginFormValues) => {
    const successLogin = await useAuthStore
      .getState()
      .login(values.email, values.password);

    if (successLogin) {
      success("Admin login successful!", { duration: 1000 });
      router.replace("/dashboard");
    } else {
      error("Invalid admin credentials");
    }
  };

  if (!hydrated) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${
          theme === "dark" ? "text-white" : "text-black"
        }`}
      >
        Checking admin authentication...
      </div>
    );
  }

  return (
    <div
      className={`max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md ${
        theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "bg-white text-black border-gray-300"
      }`}
    >
      <h1 className="text-3xl font-bold mb-6">Admin Login</h1>
      <UserForm<LoginFormValues>
        schema={loginSchema}
        defaultValues={{ email: "", password: "" }}
        onSubmit={handleAdminLogin}
        submitText="Super Admin"
        theme={theme} // ✅ pass the theme from context
      />
    </div>
  );
}
