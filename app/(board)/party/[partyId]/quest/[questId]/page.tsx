import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'
import { redirect } from 'next/navigation'
import { QuestDetail } from './quest-detail'

interface Props {
  params: Promise<{ partyId: string; questId: string }>
}

export default async function QuestPage({ params }: Props) {
  const { partyId, questId } = await params
  const sessionToken = await getSessionToken(partyId)

  if (!sessionToken) {
    redirect('/')
  }

  const supabase = createAdminClient()

  const [currentMemberRes, questRes, slotsRes, responsesRes, membersRes] = await Promise.all([
    supabase.from('members').select('*').eq('session_token', sessionToken).single(),
    supabase.from('quests').select('*').eq('id', questId).single(),
    supabase.from('quest_time_slots').select('*').eq('quest_id', questId).order('slot_date').order('day_of_week').order('start_time'),
    supabase.from('availability_responses').select('*').eq('quest_id', questId),
    supabase.from('members').select('*').eq('party_id', partyId).order('created_at'),
  ])

  if (!currentMemberRes.data || !questRes.data) {
    redirect(`/party/${partyId}`)
  }

  return (
    <QuestDetail
      quest={questRes.data}
      slots={slotsRes.data || []}
      responses={responsesRes.data || []}
      members={membersRes.data || []}
      currentMember={currentMemberRes.data}
      partyId={partyId}
    />
  )
}
