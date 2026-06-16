"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Toaster
            position="top-right"
            toastOptions={{
              className: "",
              style: {
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "13px",
                borderRadius: "12px",
                padding: "12px 16px",
              },
              success: {
                style: {
                  background: "#ECFDF5",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#065F46",
                },
                iconTheme: { primary: "#10B981", secondary: "#ECFDF5" },
              },
              error: {
                style: {
                  background: "#FEF2F2",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#991B1B",
                },
                iconTheme: { primary: "#EF4444", secondary: "#FEF2F2" },
              },
            }}
          />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
