"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useAuthStore } from "@/store/use-auth-store";

export function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        name:        session.user.name,
        email:       session.user.email,
        image:       session.user.image,
        accessToken: session.accessToken,
      });

      // upsert user ใน MongoDB ผ่าน proxy — Google token ถูกแนบอัตโนมัติ
      fetch("/api/users/sync", { method: "POST" }).catch((err) => {
        console.error("[AuthSync] sync failed:", err);
      });
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [status, session, setUser]);

  return null;
}
