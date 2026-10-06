"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ProtectedRoute from "../auth/ProtectedRoute";
import RoleGuard from "../auth/RoleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["astronaut"]}>
        <div className="min-h-screen bg-background text-foreground">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex min-h-screen flex-col lg:pl-[250px]">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-7 lg:py-6 xl:px-8">
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}