'use client'

import type { RankedSlot } from '@/lib/types'
import { DAYS_OF_WEEK } from '@/lib/constants'
import { ClassIcon } from './ClassIcon'

interface BestTimeCardProps {
  rankedSlots: RankedSlot[]
  isDm: boolean
  onDecide?: (slotId: string) => void
}

function formatSlotLabel(slot: RankedSlot['slot']): string {
  if (slot.day_of_week !== null) {
    return DAYS_OF_WEEK[slot.day_of_week]
  }
  if (slot.slot_date) {
    const d = new Date(slot.slot_date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  return '—'
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'pm' : 'am'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m}${ampm}`
}

const LABEL_STYLES: Record<string, string> = {
  'Full Party!': 'text-gold',
  'Most of the Party': 'text-available-light',
  'Risky Quest': 'text-maybe-light',
  'Skeleton Crew': 'text-unavailable-light',
}

const RANK_ICONS = ['🥇', '🥈', '🥉']

export function BestTimeCard({ rankedSlots, isDm, onDecide }: BestTimeCardProps) {
  if (rankedSlots.length === 0) {
    return (
      <div className="parchment rounded-lg p-4 text-center">
        <p className="text-parchment-500 text-sm">
          No availability data yet. Waiting for party members to respond.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rankedSlots.map((ranked, i) => (
        <div key={ranked.slot.id} className="parchment rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{RANK_ICONS[i] || '⚔️'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-[family-name:var(--font-display)] text-lg text-tavern">
                  {formatSlotLabel(ranked.slot)}
                </h3>
                <span className={`text-sm font-semibold ${LABEL_STYLES[ranked.label] || 'text-parchment-400'}`}>
                  {ranked.label}
                </span>
              </div>
              <p className="text-parchment-500 text-sm mb-2">
                {formatTime(ranked.slot.start_time)} – {formatTime(ranked.slot.end_time)}
              </p>

              {/* Member breakdown */}
              <div className="flex flex-wrap gap-3 text-xs">
                {ranked.available.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-available-light font-semibold">
                      ✓ {ranked.available.length}
                    </span>
                    <div className="flex -space-x-1">
                      {ranked.available.slice(0, 5).map((m) => (
                        <ClassIcon key={m.id} classType={m.class_icon} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
                {ranked.maybe.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-maybe-light font-semibold">? {ranked.maybe.length}</span>
                  </div>
                )}
                {ranked.unavailable.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-unavailable-light font-semibold">
                      ✕ {ranked.unavailable.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isDm && onDecide && (
              <button
                onClick={() => onDecide(ranked.slot.id)}
                className="btn-dragon px-3 py-1.5 rounded text-xs cursor-pointer shrink-0"
              >
                Decide
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
