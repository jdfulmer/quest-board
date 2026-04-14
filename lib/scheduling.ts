import type { QuestTimeSlot, AvailabilityResponse, Member, RankedSlot, QuestReadiness } from './types'

function getReadinessLabel(score: number): QuestReadiness {
  if (score >= 1) return 'Full Party!'
  if (score >= 0.75) return 'Most of the Party'
  if (score >= 0.5) return 'Risky Quest'
  return 'Skeleton Crew'
}

export function findBestSlots(
  slots: QuestTimeSlot[],
  responses: AvailabilityResponse[],
  members: Member[]
): RankedSlot[] {
  const memberCount = members.length
  if (memberCount === 0 || slots.length === 0) return []

  const memberMap = new Map(members.map((m) => [m.id, m]))

  const ranked: RankedSlot[] = slots.map((slot) => {
    const slotResponses = responses.filter((r) => r.slot_id === slot.id)
    const respondedIds = new Set(slotResponses.map((r) => r.member_id))

    const available: Member[] = []
    const maybe: Member[] = []
    const unavailable: Member[] = []
    const noResponse: Member[] = []

    for (const member of members) {
      const response = slotResponses.find((r) => r.member_id === member.id)
      if (!response) {
        noResponse.push(member)
      } else if (response.status === 'available') {
        available.push(member)
      } else if (response.status === 'maybe') {
        maybe.push(member)
      } else {
        unavailable.push(member)
      }
    }

    const score = memberCount > 0 ? available.length / memberCount : 0

    return {
      slot,
      available,
      maybe,
      unavailable,
      noResponse,
      score,
      label: getReadinessLabel(score),
    }
  })

  // Sort: most available first, then most maybe, then most responded, then earliest
  ranked.sort((a, b) => {
    if (b.available.length !== a.available.length) return b.available.length - a.available.length
    if (b.maybe.length !== a.maybe.length) return b.maybe.length - a.maybe.length

    const aResponded = a.available.length + a.maybe.length + a.unavailable.length
    const bResponded = b.available.length + b.maybe.length + b.unavailable.length
    if (bResponded !== aResponded) return bResponded - aResponded

    // Tiebreaker: earlier date/time
    const aKey = a.slot.slot_date || String(a.slot.day_of_week)
    const bKey = b.slot.slot_date || String(b.slot.day_of_week)
    if (aKey !== bKey) return aKey < bKey ? -1 : 1
    return a.slot.start_time < b.slot.start_time ? -1 : 1
  })

  return ranked.slice(0, 3)
}
