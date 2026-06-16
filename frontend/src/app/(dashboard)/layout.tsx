"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/auth";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, _hydrated, router]);

  if (!_hydrated || !isAuthenticated) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
