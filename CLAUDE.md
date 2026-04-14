@AGENTS.md

# Quest Board

D&D-themed session scheduling tool. Mobile-first PWA.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (use `@theme inline` pattern)
- Supabase (PostgreSQL + Realtime + RLS)
- Vercel deployment

## Architecture
- Cookie-based identity (no user accounts) — see `lib/identity.ts`
- Session tokens stored in `qb_identity` cookie as JSON map `{ partyId: token }`
- Admin client (`lib/supabase/admin.ts`) bypasses RLS for server-side operations
- Browser client (`lib/supabase/client.ts`) for Realtime subscriptions

## Key Patterns
- Route handlers use `createAdminClient()` for DB operations
- Pages in `(board)/` route group require identity verification
- Fonts: `var(--font-display)` = MedievalSharp (headings), `var(--font-body)` = Crimson Text (body)
- CSS classes: `.parchment`, `.btn-quest`, `.btn-dragon`, `.gold-border`, `.divider-ornate`
- D&D class types defined in `lib/types.ts` as `DndClass` union

## Database
- Schema in `supabase/migrations/001_initial_schema.sql`
- Tables: parties, members, quests, quest_time_slots, availability_responses, chat_messages
- Realtime enabled on: availability_responses, chat_messages, quests
