'use client'

import { useState } from 'react'

interface ShareLinkProps {
  inviteToken: string
}

export function ShareLink({ inviteToken }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const url = `${window.location.origin}/join/${inviteToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-quest px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-2"
    >
      <span>{copied ? '✓ Copied!' : '📜 Share Invite Link'}</span>
    </button>
  )
}
