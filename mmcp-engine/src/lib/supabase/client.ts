import { createBrowserClient } from '@supabase/ssr'

// Using untyped client — the Database type in @/types/mmcp lacks the
// Relationships[] property that @supabase/supabase-js v2 GenericTable requires,
// which causes Insert types to resolve to never. Pages type their state explicitly.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit' } }
  )
}
