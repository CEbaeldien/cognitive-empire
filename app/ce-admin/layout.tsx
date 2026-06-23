import { requireFounder } from '@/utils/supabase/server'

export default async function CEAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireFounder()
  return <>{children}</>
}
