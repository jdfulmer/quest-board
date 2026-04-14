'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [partyName, setPartyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!partyName.trim() || creating) return

    setCreating(true)
    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: partyName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/join/${data.invite_token}?dm=true`)
      }
    } catch {
      setCreating(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center max-w-lg mx-auto mb-12">
        <div className="text-6xl mb-4">📜</div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-6xl text-gold mb-4 leading-tight">
          Quest Board
        </h1>
        <p className="text-parchment-200 text-lg md:text-xl leading-relaxed">
          Rally your party. Schedule your next adventure.
        </p>
        <div className="divider-ornate mt-6 mx-auto w-48" />
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 w-full">
        <FeatureCard
          icon="⚔️"
          title="Post a Quest"
          desc="Set candidate dates and times for your session"
        />
        <FeatureCard
          icon="🗓️"
          title="Mark Availability"
          desc="Party members tap their available slots"
        />
        <FeatureCard
          icon="✨"
          title="Find the Best Time"
          desc="Auto-suggest the slot that works for everyone"
        />
      </div>

      {/* CTA */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn-quest text-xl px-8 py-4 rounded-lg cursor-pointer"
        >
          Forge a New Party
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="parchment rounded-lg p-6 w-full max-w-sm mx-auto"
        >
          <label className="block font-[family-name:var(--font-display)] text-xl text-tavern mb-3">
            Name Your Party
          </label>
          <input
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="e.g. The Fellowship of Friday Night"
            className="w-full px-4 py-3 rounded border-2 border-parchment-300 bg-parchment-50 text-tavern placeholder:text-parchment-400 focus:border-gold focus:outline-none font-[family-name:var(--font-body)] text-lg"
            autoFocus
            maxLength={60}
          />
          <button
            type="submit"
            disabled={!partyName.trim() || creating}
            className="btn-quest w-full mt-4 py-3 rounded-lg text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Forging...' : 'Begin the Adventure'}
          </button>
        </form>
      )}

      {/* Footer */}
      <p className="text-parchment-400 text-sm mt-12">
        No account needed. Just share a link with your party.
      </p>
    </main>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="parchment rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-[family-name:var(--font-display)] text-lg text-tavern mb-1">{title}</h3>
      <p className="text-tavern-light text-sm">{desc}</p>
    </div>
  )
}
