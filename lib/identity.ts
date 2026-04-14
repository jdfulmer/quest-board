import { cookies } from 'next/headers'
import type { IdentityMap } from './types'

const COOKIE_NAME = 'qb_identity'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/** Get the full identity map from the cookie */
export async function getIdentityMap(): Promise<IdentityMap> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** Get session token for a specific party */
export async function getSessionToken(partyId: string): Promise<string | null> {
  const map = await getIdentityMap()
  return map[partyId] || null
}

/** Set session token for a party (call from server action or route handler) */
export async function setSessionToken(partyId: string, sessionToken: string) {
  const cookieStore = await cookies()
  const map = await getIdentityMap()
  map[partyId] = sessionToken

  cookieStore.set(COOKIE_NAME, JSON.stringify(map), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/** Check if the current user is a member of a party */
export async function isMemberOf(partyId: string): Promise<boolean> {
  const token = await getSessionToken(partyId)
  return token !== null
}
