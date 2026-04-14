import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'

interface Params {
  params: Promise<{ partyId: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { partyId } = await params
  const sessionToken = await getSessionToken(partyId)
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not a party member' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('party_id', partyId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: Params) {
  const { partyId } = await params
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
    return NextResponse.json({ error: 'Only the DM can create quests' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, quest_type, time_slots } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Quest title is required' }, { status: 400 })
  }

  // Create quest
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .insert({
      party_id: partyId,
      title: title.trim(),
      description: description?.trim() || null,
      quest_type: quest_type || 'one-off',
      created_by: member.id,
    })
    .select('id')
    .single()

  if (questError) {
    return NextResponse.json({ error: questError.message }, { status: 500 })
  }

  // Insert time slots if provided
  if (time_slots && Array.isArray(time_slots) && time_slots.length > 0) {
    const slotsToInsert = time_slots.map((slot: { slot_date?: string; day_of_week?: number; start_time: string; end_time: string }) => ({
      quest_id: quest.id,
      slot_date: slot.slot_date || null,
      day_of_week: slot.day_of_week ?? null,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }))

    const { error: slotsError } = await supabase
      .from('quest_time_slots')
      .insert(slotsToInsert)

    if (slotsError) {
      // Clean up quest if slots fail
      await supabase.from('quests').delete().eq('id', quest.id)
      return NextResponse.json({ error: slotsError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ id: quest.id })
}
