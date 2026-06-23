import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export function createClient() {
  const cookieStore = cookies();
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storage: {
          getItem: (key: string) => cookieStore.get(key)?.value ?? null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
    }
  );
}

export async function requireFounder() {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user?.email !== "founder@cognitiveempire.com") {
    redirect("/auth/signin");
  }
  return user!;
}
