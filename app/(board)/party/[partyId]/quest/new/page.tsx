import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken } from '@/lib/identity'
import { redirect } from 'next/navigation'
import { CreateQuestForm } from './create-quest-form'

interface Props {
  params: Promise<{ partyId: string }>
}

export default async function NewQuestPage({ params }: Props) {
  const { partyId } = await params
  const sessionToken = await getSessionToken(partyId)

  if (!sessionToken) {
    redirect('/')
  }

  const supabase = createAdminClient()
  const { data: member } = await supabase
    .from('members')
    .select('id, is_dm')
    .eq('session_token', sessionToken)
    .single()

  if (!member?.is_dm) {
    redirect(`/party/${partyId}`)
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-gold mb-6">
        Post a New Quest
      </h1>
      <CreateQuestForm partyId={partyId} />
    </div>
  )
}
