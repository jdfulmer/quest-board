'use client'

import { useState, useCallback } from 'react'
import type { QuestTimeSlot, AvailabilityResponse, AvailabilityStatus, Member } from '@/lib/types'
import { DAYS_OF_WEEK } from '@/lib/constants'

interface AvailabilityGridProps {
  slots: QuestTimeSlot[]
  responses: AvailabilityResponse[]
  currentMemberId: string
  questId: string
  partyId: string
  members: Member[]
  questType: 'one-off' | 'recurring'
  isDecided: boolean
}

const STATUS_CYCLE: AvailabilityStatus[] = ['available', 'maybe', 'unavailable']

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  available: 'bg-available text-white',
  maybe: 'bg-maybe text-white',
  unavailable: 'bg-unavailable text-white',
}

const STATUS_ICONS: Record<AvailabilityStatus, string> = {
  available: '✓',
  maybe: '?',
  unavailable: '✕',
}

function formatSlotLabel(slot: QuestTimeSlot, questType: string): string {
  if (questType === 'recurring' && slot.day_of_week !== null) {
    return DAYS_OF_WEEK[slot.day_of_week].slice(0, 3)
  }
  if (slot.slot_date) {
    const d = new Date(slot.slot_date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
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

export function AvailabilityGrid({
  slots,
  responses,
  currentMemberId,
  questId,
  partyId,
  members,
  questType,
  isDecided,
}: AvailabilityGridProps) {
  // Build local response state for current user
  const [localResponses, setLocalResponses] = useState<Record<string, AvailabilityStatus>>(() => {
    const map: Record<string, AvailabilityStatus> = {}
    responses
      .filter((r) => r.member_id === currentMemberId)
      .forEach((r) => {
        map[r.slot_id] = r.status
      })
    return map
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleSlot = useCallback(
    (slotId: string) => {
      if (isDecided) return
      setLocalResponses((prev) => {
        const current = prev[slotId]
        const currentIndex = current ? STATUS_CYCLE.indexOf(current) : -1
        const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
        return { ...prev, [slotId]: STATUS_CYCLE[nextIndex] }
      })
      setSaved(false)
    },
    [isDecided]
  )

  async function handleSave() {
    if (saving) return
    setSaving(true)

    const responsesToSend = Object.entries(localResponses).map(([slot_id, status]) => ({
      slot_id,
      status,
    }))

    try {
      await fetch(`/api/party/${partyId}/quest/${questId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responsesToSend }),
      })
      setSaved(true)
    } catch {
      // ignore
    }
    setSaving(false)
  }

  // Count availability per slot for the heatmap overlay
  const slotCounts = new Map<string, { available: number; maybe: number; total: number }>()
  for (const slot of slots) {
    const slotResps = responses.filter((r) => r.slot_id === slot.id)
    slotCounts.set(slot.id, {
      available: slotResps.filter((r) => r.status === 'available').length,
      maybe: slotResps.filter((r) => r.status === 'maybe').length,
      total: members.length,
    })
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-parchment-200">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-available inline-block" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-maybe inline-block" /> Maybe
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-unavailable inline-block" /> Unavailable
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(slots.length, 4)}, minmax(140px, 1fr))` }}>
          {slots.map((slot) => {
            const myStatus = localResponses[slot.id]
            const counts = slotCounts.get(slot.id)

            return (
              <div key={slot.id} className="parchment rounded-lg overflow-hidden">
                {/* Slot header */}
                <div className="bg-tavern/10 px-3 py-2 border-b border-parchment-300">
                  <p className="font-[family-name:var(--font-display)] text-tavern text-sm font-semibold">
                    {formatSlotLabel(slot, questType)}
                  </p>
                  <p className="text-parchment-500 text-xs">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </p>
                </div>

                {/* My response button */}
                <button
                  onClick={() => toggleSlot(slot.id)}
                  disabled={isDecided}
                  className={`w-full py-6 text-center cursor-pointer transition-all text-2xl ${
                    myStatus
                      ? STATUS_STYLES[myStatus]
                      : 'bg-parchment-50 text-parchment-300 hover:bg-parchment-100'
                  } ${isDecided ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {myStatus ? STATUS_ICONS[myStatus] : 'Tap'}
                </button>

                {/* Overlap bar */}
                {counts && counts.total > 0 && (
                  <div className="px-3 py-2 bg-tavern/5 border-t border-parchment-300">
                    <div className="flex gap-1 items-center text-xs text-parchment-500">
                      <span className="text-available-light font-semibold">{counts.available}</span>
                      <span>/</span>
                      <span>{counts.total}</span>
                      <span>available</span>
                      {counts.maybe > 0 && (
                        <span className="text-maybe-light ml-1">+{counts.maybe} maybe</span>
                      )}
                    </div>
                    {/* Mini heatmap bar */}
                    <div className="mt-1 h-1.5 rounded-full bg-parchment-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-available transition-all"
                        style={{ width: `${(counts.available / counts.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save button */}
      {!isDecided && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(localResponses).length === 0}
            className="btn-quest px-8 py-3 rounded-lg text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : '🛡️ Submit Availability'}
          </button>
        </div>
      )}
    </div>
  )
}
