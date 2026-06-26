'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ApprovalRedirect() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  // Approval is a workflow stage in the canonical workspace, not a sheet.
  // Redirect to root session page — the stage machine shows approval when appropriate.
  useEffect(() => { router.replace(`/sessions/${id}`) }, [id, router])
  return null
}
