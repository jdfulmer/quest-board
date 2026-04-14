'use client'

import { ClassIcon } from './ClassIcon'
import type { Member } from '@/lib/types'

interface PartyMemberListProps {
  members: Member[]
  currentMemberId?: string
}

export function PartyMemberList({ members, currentMemberId }: PartyMemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
            member.id === currentMemberId
              ? 'bg-parchment-500/10 border border-gold/30'
              : ''
          }`}
        >
          <ClassIcon classType={member.class_icon} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-parchment-100 text-sm font-semibold truncate">
              {member.character_name}
            </p>
          </div>
          {member.is_dm && (
            <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold">
              DM
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
