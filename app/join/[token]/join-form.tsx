'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClassIcon } from '@/components/ClassIcon'
import { DND_CLASSES } from '@/lib/constants'
import type { DndClass } from '@/lib/types'

interface JoinFormProps {
  partyId: string
  isDm: boolean
}

export function JoinForm({ partyId, isDm }: JoinFormProps) {
  const [characterName, setCharacterName] = useState('')
  const [selectedClass, setSelectedClass] = useState<DndClass>('fighter')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!characterName.trim() || joining) return

    setJoining(true)
    setError('')

    try {
      const res = await fetch(`/api/party/${partyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: characterName.trim(),
          class_icon: selectedClass,
          is_dm: isDm,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to join party')
        setJoining(false)
        return
      }

      router.push(`/party/${partyId}`)
    } catch {
      setError('Something went wrong')
      setJoining(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Character Name */}
      <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-2">
        {isDm ? 'Dungeon Master Name' : 'Character Name'}
      </label>
      <input
        type="text"
        value={characterName}
        onChange={(e) => setCharacterName(e.target.value)}
        placeholder={isDm ? 'e.g. The Almighty DM' : 'e.g. Gandalf the Grey'}
        className="w-full px-4 py-3 rounded border-2 border-parchment-300 bg-parchment-50 text-tavern placeholder:text-parchment-400 focus:border-gold focus:outline-none text-lg mb-4"
        maxLength={40}
        autoFocus
      />

      {/* Class Picker */}
      <label className="block font-[family-name:var(--font-display)] text-lg text-tavern mb-2">
        Choose Your Class
      </label>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {DND_CLASSES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedClass(value)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-pointer hover:bg-parchment-200/50"
          >
            <ClassIcon
              classType={value}
              size="md"
              selected={selectedClass === value}
            />
            <span className="text-xs text-tavern-light">{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-dragon-red text-sm mb-3 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={!characterName.trim() || joining}
        className="btn-quest w-full py-3 rounded-lg text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {joining
          ? 'Entering the Tavern...'
          : isDm
            ? 'Take the DM Seat'
            : 'Join the Party'}
      </button>
    </form>
  )
}
