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
  const pathname = usePathname();

  // AI Analysis route uses a true app-shell: fixed sidebar + fixed header,
  // and a main area locked to the viewport height (no page-level scrolling).
  const isAppShell = pathname === "/astronaut/ai-analysis";

  if (isAppShell) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={["astronaut"]}>
          <div className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:max-h-dvh lg:overflow-hidden lg:pl-[250px]">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex min-h-dvh flex-col lg:h-full lg:min-h-0 lg:flex-1">
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
              <main className="w-full flex-col px-4 py-6 sm:px-6 lg:flex lg:h-auto lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:px-7 lg:pb-1 lg:pt-6 xl:px-8">
                {children}
              </main>
            </div>
          </div>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["astronaut"]}>
        <div className="min-h-screen bg-background text-foreground">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex min-h-screen flex-col lg:pl-[250px]">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-7 lg:py-7 xl:px-8">
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}