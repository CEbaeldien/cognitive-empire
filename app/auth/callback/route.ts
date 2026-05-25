import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  const response = NextResponse.redirect(new URL('/admin/drift', requestUrl.origin))
  response.cookies.set('sb-auth', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  return response
}
