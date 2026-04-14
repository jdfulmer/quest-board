'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClassIcon } from './ClassIcon'
import type { ChatMessage, Member } from '@/lib/types'

interface ChatProps {
  partyId: string
  currentMember: Member
  members: Member[]
}

export function Chat({ partyId, currentMember, members }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const memberMap = new Map(members.map((m) => [m.id, m]))

  // Load initial messages
  useEffect(() => {
    fetch(`/api/chat/${partyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data)
      })
  }, [partyId])

  // Subscribe to real-time messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partyId])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    try {
      await fetch(`/api/chat/${partyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch {
      setNewMessage(content) // Restore on failure
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-parchment-400 text-sm text-center mt-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const author = memberMap.get(msg.member_id)
            const isMe = msg.member_id === currentMember.id

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {author && (
                  <ClassIcon classType={author.class_icon} size="sm" />
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isMe
                      ? 'bg-gold/20 text-parchment-100'
                      : 'bg-tavern-light/50 text-parchment-100'
                  }`}
                >
                  {!isMe && author && (
                    <p className="text-xs text-gold font-semibold mb-0.5">
                      {author.character_name}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-xs text-parchment-400 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-parchment-500/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-tavern-light/50 border border-parchment-500/30 text-parchment-100 placeholder:text-parchment-400 focus:border-gold focus:outline-none text-sm"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-quest px-3 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  )
}
