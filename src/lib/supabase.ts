import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermitType = 'A' | 'B' | 'C' | 'R' | 'V'

export type LotStatus = 'empty' | 'available' | 'filling' | 'almost_full' | 'full' | 'blocked'

export interface Lot {
  id: string
  name: string
  short_name: string
  permits: PermitType[]
  lat: number
  lng: number
  capacity: number
  occupancy: number
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  permit_type: PermitType
  display_name: string | null
}

export interface Report {
  id: string
  lot_id: string
  user_id: string
  status: LotStatus
  note: string | null
  upvotes: number
  created_at: string
  // joined
  lot?: Pick<Lot, 'name' | 'short_name'>
  profile?: Pick<Profile, 'display_name' | 'email'>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function occupancyPct(lot: Lot): number {
  return Math.round((lot.occupancy / lot.capacity) * 100)
}

export function occupancyColor(pct: number): string {
  if (pct < 50) return '#2D9B6F'   // green
  if (pct < 80) return '#E8A020'   // amber
  return '#D84C3A'                  // red
}

export function occupancyLabel(pct: number): string {
  if (pct < 15) return 'Empty'
  if (pct < 50) return 'Available'
  if (pct < 80) return 'Filling up'
  if (pct < 92) return 'Almost full'
  return 'Full'
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export const STATUS_LABELS: Record<LotStatus, string> = {
  empty:       'Empty — lots of space',
  available:   'Available — spots open',
  filling:     'Filling up',
  almost_full: 'Almost full',
  full:        'Completely full',
  blocked:     'Blocked / issue',
}
