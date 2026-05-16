"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Welcome to Nemu Note</h1>
        <p className="text-default-500">Sign in to continue</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-default-200 bg-content1 p-8 shadow-sm">
        <Button className="w-full" variant="tertiary" onPress={handleGoogleSignIn}>
        <Icon icon="devicon:google" />
        Sign in with Google
      </Button>
      </div>
    </section>
  );
}
