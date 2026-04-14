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
    .from('chat_messages')
    .select('*')
    .eq('party_id', partyId)
    .order('created_at', { ascending: true })
    .limit(100)

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

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('session_token', sessionToken)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      party_id: partyId,
      member_id: member.id,
      content: content.trim(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
