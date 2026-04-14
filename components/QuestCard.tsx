'use client'

import Link from 'next/link'
import type { Quest } from '@/lib/types'

interface QuestCardProps {
  quest: Quest
  partyId: string
  responseCount?: number
  memberCount?: number
}

const STATUS_STYLES = {
  open: { bg: 'bg-forest/20', text: 'text-available-light', label: 'Open' },
  decided: { bg: 'bg-gold/20', text: 'text-gold', label: 'Decided' },
  archived: { bg: 'bg-parchment-400/20', text: 'text-parchment-400', label: 'Archived' },
}

export function QuestCard({ quest, partyId, responseCount, memberCount }: QuestCardProps) {
  const status = STATUS_STYLES[quest.status]

  return (
    <Link
      href={`/party/${partyId}/quest/${quest.id}`}
      className="parchment rounded-lg p-4 block hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-[family-name:var(--font-display)] text-lg text-tavern leading-tight">
          {quest.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status.bg} ${status.text} shrink-0`}>
          {status.label}
        </span>
      </div>

      {quest.description && (
        <p className="text-tavern-light text-sm mb-2 line-clamp-2">{quest.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-parchment-500">
        <span>{quest.quest_type === 'recurring' ? '🔄 Weekly' : '📅 One-off'}</span>
        {responseCount !== undefined && memberCount !== undefined && (
          <span>
            {responseCount}/{memberCount} responded
          </span>
        )}
      </div>
    </Link>
  )
}
