import type { Metadata }   from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

import { TopNav }           from './_components/TopNav'
import { TelemetryRails }   from './_components/TelemetryRails'
import { OpsKernelConsole } from './_components/OpsKernelConsole'

/* ─────────────────────────────────────────────────────────
   Fonts
───────────────────────────────────────────────────────── */
const inter = Inter({ subsets: ['latin'], display: 'swap' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-playfair',
  display: 'swap',
})

/* ─────────────────────────────────────────────────────────
   Metadata
───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Ops Kernel — Cognitive Empire',
  description:
    'An interactive command-center for Cognitive Empire doctrine. Navigate the Ops Kernel and Maintenance Gravity canon by module.',
  openGraph: {
    title: 'Ops Kernel — Cognitive Empire',
    description: 'Intelligence Is Abundant. Judgment Is Power.',
    siteName: 'Cognitive Empire',
  },
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */
export default function OperatorKernelPage() {
  return (
    <div
      className={`${inter.className} ${playfair.variable} antialiased text-[#E6EDF7] ce-kernel-root`}
      style={{ background: '#05070B', minHeight: '100vh' }}
    >
      <TelemetryRails />
      <TopNav />
      <OpsKernelConsole />
    </div>
  )
}
