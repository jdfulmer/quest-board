import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'

interface Params {
  params: Promise<{ partyId: string; questId: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const { partyId, questId } = await params
  const sessionToken = await getSessionToken(partyId)
  if (!sessionToken) {
    return NextResponse.json({ error: 'Not a party member' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('session_token', sessionToken)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const { responses } = await request.json()

  if (!Array.isArray(responses)) {
    return NextResponse.json({ error: 'responses must be an array' }, { status: 400 })
  }

  // Upsert all responses
  const toUpsert = responses.map((r: { slot_id: string; status: string }) => ({
    quest_id: questId,
    member_id: member.id,
    slot_id: r.slot_id,
    status: r.status,
  }))

  const { error } = await supabase
    .from('availability_responses')
    .upsert(toUpsert, { onConflict: 'quest_id,member_id,slot_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
