"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/auth/LoginPage";
import { UserSession } from "@/lib/types";

export default function LoginRoutePage() {
  const router = useRouter();

  const handleLoginSuccess = (session: UserSession) => {
    try {
      localStorage.setItem("carepulse_active_user", JSON.stringify(session));
    } catch {}
    router.push("/");
  };

  return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}
