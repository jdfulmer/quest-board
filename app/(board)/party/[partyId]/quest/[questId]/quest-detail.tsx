'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AvailabilityGrid } from '@/components/AvailabilityGrid'
import { BestTimeCard } from '@/components/BestTimeCard'
import { findBestSlots } from '@/lib/scheduling'
import { DAYS_OF_WEEK } from '@/lib/constants'
import type { Quest, QuestTimeSlot, AvailabilityResponse, Member } from '@/lib/types'

interface QuestDetailProps {
  quest: Quest
  slots: QuestTimeSlot[]
  responses: AvailabilityResponse[]
  members: Member[]
  currentMember: Member
  partyId: string
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m}${ampm}`
}

export function QuestDetail({
  quest,
  slots,
  responses,
  members,
  currentMember,
  partyId,
}: QuestDetailProps) {
  const [deciding, setDeciding] = useState(false)
  const router = useRouter()
  const isDm = currentMember.is_dm
  const isDecided = quest.status === 'decided'

  const rankedSlots = findBestSlots(slots, responses, members)

  async function handleDecide(slotId: string) {
    if (deciding) return
    setDeciding(true)

    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return

    try {
      await fetch(`/api/party/${partyId}/quest/${quest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'decided',
          decided_slot: {
            slot_id: slotId,
            slot_date: slot.slot_date,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
          },
        }),
      })
      router.refresh()
    } catch {
      setDeciding(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Back link */}
      <Link
        href={`/party/${partyId}`}
        className="text-gold hover:text-gold-light text-sm mb-4 inline-block"
      >
        ← Back to Quest Board
      </Link>

      {/* Quest header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-gold flex-1">
            {quest.title}
          </h1>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${
              isDecided
                ? 'bg-gold/20 text-gold'
                : 'bg-forest/20 text-available-light'
            }`}
          >
            {isDecided ? 'Decided' : 'Open'}
          </span>
        </div>
        {quest.description && (
          <p className="text-parchment-300 mb-2">{quest.description}</p>
        )}
        <p className="text-parchment-400 text-sm">
          {quest.quest_type === 'recurring' ? '🔄 Weekly Recurring' : '📅 One-off Session'}
          {' · '}
          {slots.length} time slot{slots.length !== 1 ? 's' : ''}
          {' · '}
          {members.length} party member{members.length !== 1 ? 's' : ''}
        </p>
        <div className="divider-ornate mt-4 w-32" />
      </div>

      {/* Decided banner */}
      {isDecided && quest.decided_slot && (
        <div className="gold-border rounded-lg p-4 mb-6 bg-gold/5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-gold">
                Quest Decided!
              </h2>
              <p className="text-parchment-200">
                {quest.decided_slot.slot_date
                  ? new Date(quest.decided_slot.slot_date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : quest.decided_slot.day_of_week !== undefined
                    ? `Every ${DAYS_OF_WEEK[quest.decided_slot.day_of_week]}`
                    : ''
                }
                {' '}at {formatTime(quest.decided_slot.start_time)} – {formatTime(quest.decided_slot.end_time)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Availability Grid */}
      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-parchment-100 mb-4">
          {isDecided ? 'Party Availability' : 'Mark Your Availability'}
        </h2>
        <AvailabilityGrid
          slots={slots}
          responses={responses}
          currentMemberId={currentMember.id}
          questId={quest.id}
          partyId={partyId}
          members={members}
          questType={quest.quest_type}
          isDecided={isDecided}
        />
      </section>

      {/* Best Time Suggestions */}
      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-parchment-100 mb-4">
          ✨ Best Time Suggestions
        </h2>
        <BestTimeCard
          rankedSlots={rankedSlots}
          isDm={isDm && !isDecided}
          onDecide={!isDecided ? handleDecide : undefined}
        />
      </section>
    </div>
  )
}
