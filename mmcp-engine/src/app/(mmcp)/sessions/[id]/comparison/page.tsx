'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ComparisonRedirect() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  useEffect(() => { router.replace(`/sessions/${id}?layer=comparison`) }, [id, router])
  return null
}
