"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isAdminLoggedIn = useAuthStore((state) => state.isAdminLoggedIn);
  const hydrated = useAuthStore((state) => state.hydrated);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const verify = async () => {
      if (!hydrated) {
        await checkAuth();
      }

      // After hydration, redirect if not logged in
      const state = useAuthStore.getState();
      if (state.hydrated && !state.isAdminLoggedIn) {
        router.replace("/");
      }
    };

    verify();
  }, [hydrated, checkAuth, router]);

  if (!hydrated || !isAdminLoggedIn) {
    return (
      <div className='flex items-center justify-center min-h-screen text-white'>
        Checking admin authentication...
      </div>
    );
  }

  return <>{children}</>;
}
