"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verify auth via server check (cookie is httpOnly)
    fetch("/api/login/verify")
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  // Don't render anything until auth is confirmed — prevents sidebar flash
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen md:ml-64">
        {children}
      </main>
    </div>
  );
}

