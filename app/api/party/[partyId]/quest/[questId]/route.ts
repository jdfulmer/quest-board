import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'

interface Params {
  params: Promise<{ partyId: string; questId: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { partyId, questId } = await params
  const sessionToken = await getSessionToken(partyId)
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not a party member' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const [questRes, slotsRes, responsesRes] = await Promise.all([
    supabase.from('quests').select('*').eq('id', questId).single(),
    supabase.from('quest_time_slots').select('*').eq('quest_id', questId).order('slot_date').order('day_of_week').order('start_time'),
    supabase.from('availability_responses').select('*').eq('quest_id', questId),
  ])

  if (!questRes.data) {
    return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
  }

  return NextResponse.json({
    quest: questRes.data,
    time_slots: slotsRes.data || [],
    responses: responsesRes.data || [],
  })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { partyId, questId } = await params
  const sessionToken = await getSessionToken(partyId)
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not a party member' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Verify DM
  const { data: member } = await supabase
    .from('members')
    .select('id, is_dm')
    .eq('session_token', sessionToken)
    .single()

  if (!member?.is_dm) {
    return NextResponse.json({ error: 'Only the DM can update quests' }, { status: 403 })
  }

  const body = await request.json()
  const { status, decided_slot } = body

  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (decided_slot) update.decided_slot = decided_slot

  const { data, error } = await supabase
    .from('quests')
    .update(update)
    .eq('id', questId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
