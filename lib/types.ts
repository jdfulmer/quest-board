// ============================================
// Database row types
// ============================================

export interface Party {
  id: string
  name: string
  dm_member_id: string | null
  invite_token: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  party_id: string
  character_name: string
  class_icon: DndClass
  is_dm: boolean
  session_token: string
  created_at: string
}

export interface Quest {
  id: string
  party_id: string
  title: string
  description: string | null
  quest_type: 'one-off' | 'recurring'
  status: 'open' | 'decided' | 'archived'
  decided_slot: DecidedSlot | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuestTimeSlot {
  id: string
  quest_id: string
  slot_date: string | null       // ISO date for one-off
  day_of_week: number | null     // 0=Sun..6=Sat for recurring
  start_time: string             // HH:MM:SS
  end_time: string               // HH:MM:SS
}

export interface AvailabilityResponse {
  id: string
  quest_id: string
  member_id: string
  slot_id: string
  status: AvailabilityStatus
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  party_id: string
  member_id: string
  content: string
  created_at: string
}

// ============================================
// App types
// ============================================

export type AvailabilityStatus = 'available' | 'maybe' | 'unavailable'

export type DndClass =
  | 'fighter'
  | 'wizard'
  | 'rogue'
  | 'cleric'
  | 'ranger'
  | 'bard'
  | 'paladin'
  | 'warlock'
  | 'druid'
  | 'monk'
  | 'barbarian'
  | 'sorcerer'

export interface DecidedSlot {
  slot_id: string
  slot_date?: string
  day_of_week?: number
  start_time: string
  end_time: string
}

export interface RankedSlot {
  slot: QuestTimeSlot
  available: Member[]
  maybe: Member[]
  unavailable: Member[]
  noResponse: Member[]
  score: number          // 0-1, percentage of available members
  label: QuestReadiness
}

export type QuestReadiness =
  | 'Full Party!'
  | 'Most of the Party'
  | 'Risky Quest'
  | 'Skeleton Crew'

// Identity stored in cookie
export interface IdentityMap {
  [partyId: string]: string  // partyId -> sessionToken
}
