import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components cannot set cookies; session is written client-side after hash exchange.
        },
      },
    }
  );
}

export async function requireFounder() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (user?.email !== "founder@cognitiveempire.com") {
    redirect("/auth/signin");
  }
  return user!;
}
