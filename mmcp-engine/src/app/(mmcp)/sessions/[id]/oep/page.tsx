'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function OepRedirect() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  useEffect(() => { router.replace(`/sessions/${id}?layer=reasoning`) }, [id, router])
  return null
}
