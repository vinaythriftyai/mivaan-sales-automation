"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser } from "@/lib/auth";

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}