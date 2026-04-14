import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'
import { redirect } from 'next/navigation'
import { PartyDashboard } from './dashboard'

interface Props {
  params: Promise<{ partyId: string }>
}

export default async function PartyPage({ params }: Props) {
  const { partyId } = await params
  const sessionToken = await getSessionToken(partyId)

  if (!sessionToken) {
    redirect('/')
  }

  const supabase = createAdminClient()

  // Fetch party, members, quests, and current member in parallel
  const [partyRes, membersRes, questsRes, currentMemberRes] = await Promise.all([
    supabase.from('parties').select('*').eq('id', partyId).single(),
    supabase.from('members').select('*').eq('party_id', partyId).order('created_at'),
    supabase.from('quests').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
    supabase.from('members').select('*').eq('session_token', sessionToken).single(),
  ])

  if (!partyRes.data || !currentMemberRes.data) {
    redirect('/')
  }

  return (
    <PartyDashboard
      party={partyRes.data}
      members={membersRes.data || []}
      quests={questsRes.data || []}
      currentMember={currentMemberRes.data}
    />
  )
}
