"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const supabase = getSupabaseClient();

    if (!code || !supabase) {
      router.replace("/");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => router.replace("/"))
      .catch(() => router.replace("/auth?error=1"));
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      <p className="text-sm text-gray-500">Verificando tu sesión...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
