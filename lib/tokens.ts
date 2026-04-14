import { nanoid } from 'nanoid'

/** Generate an invite token for party links (URL-safe, 12 chars) */
export function generateInviteToken(): string {
  return nanoid(12)
}

/** Generate a session token for member identity (21 chars) */
export function generateSessionToken(): string {
  return nanoid(21)
}
