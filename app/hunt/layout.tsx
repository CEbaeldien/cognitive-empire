import { requireFounder } from '@/utils/supabase/server'

export default async function HuntLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireFounder()
  return <>{children}</>
}
