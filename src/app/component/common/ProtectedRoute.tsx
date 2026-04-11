"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSupabaseAuth } from "@/lib/hooks/userCheckAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { session, loading } = useSupabaseAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
