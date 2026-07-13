import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cognitiveempire.com'

const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/signals',
  '/research/maintenance-gravity',
  '/maintenance-gravity',
  '/work',
  '/connect',
  '/briefs',
  '/drift',
  '/hunt',
  '/foundrylabs',
  '/execution-ops',
  '/governance-ops',
  '/physical-infra-ops',
  '/operator-kernel',
  '/ce-research',
  '/legal',
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/refund',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}
