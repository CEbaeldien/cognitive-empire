"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Check hash for provider-level errors before Supabase processes it
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.slice(1));
      const msg = params.get("error_description") ?? params.get("error") ?? "auth_error";
      router.replace(`/auth/signin?error=${encodeURIComponent(msg)}`);
      return;
    }

    // createBrowserClient with flowType: 'implicit' reads the access_token from
    // the URL hash and fires SIGNED_IN automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/ce-admin");
      }
    });

    // Fallback: session already set on re-render
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/ce-admin");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#09091c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <p style={{ color: "#64748b", fontSize: 13 }}>Authenticating…</p>
    </div>
  );
}
