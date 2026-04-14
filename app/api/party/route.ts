import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInviteToken } from '@/lib/tokens'

export async function POST(request: NextRequest) {
  const { name } = await request.json()

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Party name is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const invite_token = generateInviteToken()

  const { data, error } = await supabase
    .from('parties')
    .insert({ name: name.trim(), invite_token })
    .select('id, invite_token')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
