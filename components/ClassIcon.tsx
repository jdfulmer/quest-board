'use client'

import type { DndClass } from '@/lib/types'

const CLASS_ICONS: Record<DndClass, { emoji: string; color: string }> = {
  fighter: { emoji: '⚔️', color: '#8b4513' },
  wizard: { emoji: '🔮', color: '#4a1a6b' },
  rogue: { emoji: '🗡️', color: '#2f4f4f' },
  cleric: { emoji: '✝️', color: '#c5a55a' },
  ranger: { emoji: '🏹', color: '#2d5016' },
  bard: { emoji: '🎵', color: '#8b1a6b' },
  paladin: { emoji: '🛡️', color: '#c5a55a' },
  warlock: { emoji: '👁️', color: '#4a1a4a' },
  druid: { emoji: '🌿', color: '#2d5016' },
  monk: { emoji: '👊', color: '#8b6914' },
  barbarian: { emoji: '🪓', color: '#8b1a1a' },
  sorcerer: { emoji: '⚡', color: '#4a1a6b' },
}

interface ClassIconProps {
  classType: DndClass
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
}

const sizes = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
}

export function ClassIcon({ classType, size = 'md', selected = false }: ClassIconProps) {
  const icon = CLASS_ICONS[classType]

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center border-2 transition-all ${
        selected
          ? 'border-gold bg-tavern shadow-[0_0_12px_rgba(197,165,90,0.5)]'
          : 'border-parchment-300 bg-tavern/80'
      }`}
      style={{ borderColor: selected ? undefined : icon.color }}
    >
      <span role="img" aria-label={classType}>
        {icon.emoji}
      </span>
    </div>
  )
}
