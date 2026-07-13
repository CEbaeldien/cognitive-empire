import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cognitiveempire.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/ce-admin/', '/api/', '/auth/', '/internal/', '/dev/', '/orchestrator/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
