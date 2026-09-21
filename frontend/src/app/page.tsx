"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { LoadingState } from "../components/shared/LoadingState";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/health",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin/dashboard",
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(ROLE_REDIRECTS[user.role] || "/login");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return <LoadingState message="Establishing secure mission link..." />;
}