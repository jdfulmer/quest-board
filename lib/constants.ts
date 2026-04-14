import type { DndClass } from './types'

export const DND_CLASSES: { value: DndClass; label: string }[] = [
  { value: 'fighter', label: 'Fighter' },
  { value: 'wizard', label: 'Wizard' },
  { value: 'rogue', label: 'Rogue' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'bard', label: 'Bard' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'warlock', label: 'Warlock' },
  { value: 'druid', label: 'Druid' },
  { value: 'monk', label: 'Monk' },
  { value: 'barbarian', label: 'Barbarian' },
  { value: 'sorcerer', label: 'Sorcerer' },
]

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const TIME_SLOT_INTERVAL_MINUTES = 30

// Generate time labels from 8am to midnight in 30-min increments
export const TIME_LABELS: string[] = []
for (let hour = 8; hour <= 23; hour++) {
  for (let min = 0; min < 60; min += TIME_SLOT_INTERVAL_MINUTES) {
    const h = hour.toString().padStart(2, '0')
    const m = min.toString().padStart(2, '0')
    TIME_LABELS.push(`${h}:${m}`)
  }
}
