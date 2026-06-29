import CENav from '@/app/components/CENav'
import CEFooter from '@/app/components/CEFooter'
import { SubscribeForm } from './_components/SubscribeForm'

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const { tier } = await searchParams

  return (
    <div style={{
      background: '#03050A',
      color: '#EBF1FA',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
    }}>
      <CENav />
      <SubscribeForm tier={tier ?? 'starter'} />
      <CEFooter />
    </div>
  )
}
