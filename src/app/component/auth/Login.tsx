"use client";

import { useEffect } from "react";
import { UserForm } from "../common/UserForm";
import { loginSchema, LoginFormValues } from "@/app/lib/utils/formSchema";
import { useRouter } from "next/navigation";
import { useSheiNotification } from "@/app/lib/hooks/useSheiNotification";
import { useAuthStore } from "@/app/lib/store/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { success, error } = useSheiNotification();
  const isAdminLoggedIn = useAuthStore((state) => state.isAdminLoggedIn);
  const hydrated = useAuthStore((state) => state.hydrated);

  // ✅ Call checkAuth inside useEffect without passing it as dependency
  useEffect(() => {
    const check = async () => {
      const store = useAuthStore.getState();
      if (!store.hydrated) {
        await store.checkAuth();
      }
    };
    check();
  }, []); // stable, no dynamic deps

  useEffect(() => {
    if (hydrated && isAdminLoggedIn) {
      router.replace("/dashboard");
    }
  }, [hydrated, isAdminLoggedIn, router]);

  const handleAdminLogin = async (values: LoginFormValues) => {
    const ADMIN_EMAIL = "admin@sheihoise.com";
    const ADMIN_PASSWORD = "admin123";

    if (values.email === ADMIN_EMAIL && values.password === ADMIN_PASSWORD) {
      useAuthStore.setState({ isAdminLoggedIn: true });
      success("Admin Login successful!", { duration: 1000 });
      router.replace("/dashboard");
    } else {
      error("Invalid admin credentials");
    }
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen text-black">
        Checking admin authentication...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold text-left mb-6">Admin Login</h1>
      <UserForm<LoginFormValues>
        schema={loginSchema}
        defaultValues={{ email: "", password: "" }}
        onSubmit={handleAdminLogin}
        submitText="Super Admin"
      />
    </div>
  );
}
