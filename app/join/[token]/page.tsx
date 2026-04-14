import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { JoinForm } from './join-form'

interface Props {
  params: Promise<{ token: string }>
  searchParams: Promise<{ dm?: string }>
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { token } = await params
  const { dm } = await searchParams

  const supabase = createAdminClient()
  const { data: party } = await supabase
    .from('parties')
    .select('id, name')
    .eq('invite_token', token)
    .single()

  if (!party) {
    notFound()
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="parchment rounded-lg p-6 w-full max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚔️</div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-tavern">
            {dm === 'true' ? 'Create Your Character' : 'Join the Party'}
          </h1>
          <p className="text-tavern-light mt-1">{party.name}</p>
        </div>
        <JoinForm partyId={party.id} isDm={dm === 'true'} />
      </div>
    </main>
  )
}
