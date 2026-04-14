import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateSessionToken } from '@/lib/tokens'
import { cookies } from 'next/headers'

interface Params {
  params: Promise<{ partyId: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const { partyId } = await params
  const { character_name, class_icon, is_dm } = await request.json()

  if (!character_name || typeof character_name !== 'string') {
    return NextResponse.json({ error: 'Character name is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify party exists
  const { data: party } = await supabase
    .from('parties')
    .select('id')
    .eq('id', partyId)
    .single()

  if (!party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 })
  }

  const session_token = generateSessionToken()

  // Create member
  const { data: member, error } = await supabase
    .from('members')
    .insert({
      party_id: partyId,
      character_name: character_name.trim(),
      class_icon: class_icon || 'fighter',
      is_dm: is_dm || false,
      session_token,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That character name is taken in this party' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If DM, set dm_member_id on the party
  if (is_dm) {
    await supabase
      .from('parties')
      .update({ dm_member_id: member.id })
      .eq('id', partyId)
  }

  // Set identity cookie
  const cookieStore = await cookies()
  const existingRaw = cookieStore.get('qb_identity')?.value
  let identityMap: Record<string, string> = {}
  if (existingRaw) {
    try { identityMap = JSON.parse(existingRaw) } catch { /* ignore */ }
  }
  identityMap[partyId] = session_token

  cookieStore.set('qb_identity', JSON.stringify(identityMap), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  return NextResponse.json({ id: member.id, party_id: partyId })
}
