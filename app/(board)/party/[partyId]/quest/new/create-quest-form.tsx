'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DAYS_OF_WEEK } from '@/lib/constants'

interface TimeSlotInput {
  id: string
  slot_date?: string
  day_of_week?: number
  start_time: string
  end_time: string
}

interface CreateQuestFormProps {
  partyId: string
}

export function CreateQuestForm({ partyId }: CreateQuestFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questType, setQuestType] = useState<'one-off' | 'recurring'>('one-off')
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([])
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  function addOneOffSlot() {
    setTimeSlots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        slot_date: '',
        start_time: '18:00',
        end_time: '22:00',
      },
    ])
  }

  function addRecurringSlot() {
    setTimeSlots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        day_of_week: 5, // Friday
        start_time: '18:00',
        end_time: '22:00',
      },
    ])
  }

  function updateSlot(id: string, updates: Partial<TimeSlotInput>) {
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  function removeSlot(id: string) {
    setTimeSlots((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || timeSlots.length === 0 || submitting) return

    setSubmitting(true)

    const slots = timeSlots.map((s) => ({
      slot_date: s.slot_date || undefined,
      day_of_week: s.day_of_week ?? undefined,
      start_time: s.start_time,
      end_time: s.end_time,
    }))

    try {
      const res = await fetch(`/api/party/${partyId}/quest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          quest_type: questType,
          time_slots: slots,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/party/${partyId}/quest/${data.id}`)
      }
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="parchment rounded-lg p-4">
        <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-2">
          Quest Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Dragon Slaying Session"
          className="w-full px-4 py-3 rounded border-2 border-parchment-300 bg-parchment-50 text-tavern placeholder:text-parchment-400 focus:border-gold focus:outline-none text-lg"
          maxLength={80}
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="parchment rounded-lg p-4">
        <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-2">
          Quest Description <span className="text-sm text-parchment-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some flavor text for your party..."
          className="w-full px-4 py-3 rounded border-2 border-parchment-300 bg-parchment-50 text-tavern placeholder:text-parchment-400 focus:border-gold focus:outline-none resize-none"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Quest Type */}
      <div className="parchment rounded-lg p-4">
        <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-3">
          Quest Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setQuestType('one-off'); setTimeSlots([]) }}
            className={`flex-1 py-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
              questType === 'one-off'
                ? 'border-gold bg-gold/10 text-tavern font-semibold'
                : 'border-parchment-300 text-parchment-500 hover:border-parchment-400'
            }`}
          >
            📅 One-off Session
          </button>
          <button
            type="button"
            onClick={() => { setQuestType('recurring'); setTimeSlots([]) }}
            className={`flex-1 py-3 rounded-lg border-2 text-center cursor-pointer transition-colors ${
              questType === 'recurring'
                ? 'border-gold bg-gold/10 text-tavern font-semibold'
                : 'border-parchment-300 text-parchment-500 hover:border-parchment-400'
            }`}
          >
            🔄 Weekly Recurring
          </button>
        </div>
      </div>

      {/* Time Slots */}
      <div className="parchment rounded-lg p-4">
        <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-3">
          Candidate Time Slots
        </label>

        {timeSlots.length === 0 ? (
          <p className="text-parchment-400 text-sm mb-3">
            Add time slots for your party to vote on.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 bg-parchment-50 rounded-lg p-3 border border-parchment-200">
                {questType === 'one-off' ? (
                  <input
                    type="date"
                    value={slot.slot_date || ''}
                    onChange={(e) => updateSlot(slot.id, { slot_date: e.target.value })}
                    className="px-2 py-1.5 rounded border border-parchment-300 bg-white text-tavern text-sm focus:border-gold focus:outline-none"
                  />
                ) : (
                  <select
                    value={slot.day_of_week ?? 5}
                    onChange={(e) => updateSlot(slot.id, { day_of_week: parseInt(e.target.value) })}
                    className="px-2 py-1.5 rounded border border-parchment-300 bg-white text-tavern text-sm focus:border-gold focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                )}

                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateSlot(slot.id, { start_time: e.target.value })}
                  className="px-2 py-1.5 rounded border border-parchment-300 bg-white text-tavern text-sm focus:border-gold focus:outline-none"
                />
                <span className="text-parchment-400 text-sm">to</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateSlot(slot.id, { end_time: e.target.value })}
                  className="px-2 py-1.5 rounded border border-parchment-300 bg-white text-tavern text-sm focus:border-gold focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="text-dragon-red hover:text-unavailable-light ml-auto cursor-pointer text-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={questType === 'one-off' ? addOneOffSlot : addRecurringSlot}
          className="w-full py-2 rounded-lg border-2 border-dashed border-parchment-300 text-parchment-500 hover:border-gold hover:text-tavern transition-colors cursor-pointer text-sm"
        >
          + Add Time Slot
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!title.trim() || timeSlots.length === 0 || submitting}
        className="btn-dragon w-full py-4 rounded-lg text-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Posting Quest...' : '⚔️ Post Quest to the Board'}
      </button>
    </form>
  )
}
