'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PartyMemberList } from '@/components/PartyMemberList'
import { QuestCard } from '@/components/QuestCard'
import { ShareLink } from '@/components/ShareLink'
import { Chat } from '@/components/Chat'
import type { Party, Member, Quest } from '@/lib/types'

interface PartyDashboardProps {
  party: Party
  members: Member[]
  quests: Quest[]
  currentMember: Member
}

export function PartyDashboard({ party, members, quests, currentMember }: PartyDashboardProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const isDm = currentMember.is_dm

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Party header */}
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-gold mb-1">
            {party.name}
          </h1>
          <p className="text-parchment-300 text-sm">
            {members.length} adventurer{members.length !== 1 ? 's' : ''} in the party
          </p>
          <div className="divider-ornate mt-3 w-32" />
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <ShareLink inviteToken={party.invite_token} />
          {isDm && (
            <Link
              href={`/party/${party.id}/quest/new`}
              className="btn-dragon px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              ⚔️ Post a Quest
            </Link>
          )}
        </div>

        {/* Quests list */}
        <section className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-parchment-100 mb-3">
            Active Quests
          </h2>
          {quests.length === 0 ? (
            <div className="parchment rounded-lg p-6 text-center">
              <p className="text-tavern-light">
                {isDm
                  ? 'No quests posted yet. Post your first quest to start scheduling!'
                  : 'The DM hasn\'t posted any quests yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  partyId={party.id}
                  memberCount={members.length}
                />
              ))}
            </div>
          )}
        </section>

        {/* Party Members (visible on mobile, hidden on desktop where sidebar shows it) */}
        <section className="md:hidden mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-parchment-100 mb-3">
            Party Members
          </h2>
          <div className="bg-tavern-light/30 rounded-lg p-3">
            <PartyMemberList members={members} currentMemberId={currentMember.id} />
          </div>
        </section>
      </div>

      {/* Desktop sidebar: members + chat */}
      <aside className="hidden md:flex flex-col w-80 border-l border-parchment-500/20 bg-tavern/50">
        <div className="p-4 border-b border-parchment-500/20">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-parchment-100 mb-3">
            Party Members
          </h2>
          <PartyMemberList members={members} currentMemberId={currentMember.id} />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <Chat
            partyId={party.id}
            currentMember={currentMember}
            members={members}
          />
        </div>
      </aside>

      {/* Mobile chat toggle */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="md:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full btn-quest flex items-center justify-center text-2xl shadow-lg cursor-pointer z-40"
      >
        💬
      </button>

      {/* Mobile chat drawer */}
      {chatOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative mt-auto bg-tavern border-t border-gold/30 rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-parchment-500/20">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-gold">
                Party Chat
              </h2>
              <button
                onClick={() => setChatOpen(false)}
                className="text-parchment-400 hover:text-parchment-100 text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Chat
                partyId={party.id}
                currentMember={currentMember}
                members={members}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
