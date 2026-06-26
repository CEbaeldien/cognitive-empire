'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function TimelineRedirect() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  useEffect(() => { router.replace(`/sessions/${id}?layer=timeline`) }, [id, router])
  return null
}
