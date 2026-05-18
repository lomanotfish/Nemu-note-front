"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useAuthStore } from "@/store/use-auth-store";

export function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        accessToken: session.accessToken,
      };
      setUser(user);
      console.log("[AuthSync] user logged in:", user);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [status, session, setUser]);

  return null;
}
