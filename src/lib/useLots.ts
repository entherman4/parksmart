import { useEffect, useState } from 'react'
import { supabase, Lot, occupancyPct } from '../lib/supabase'
import { PermitType } from '../lib/supabase'

export function useLots(permitFilter?: PermitType) {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchLots()

    // Subscribe to real-time updates on the lots table
    const channel = supabase
      .channel('lots-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lots' },
        (payload) => {
          // Merge updated lot into state without a full refetch
          setLots(prev =>
            prev.map(l => l.id === payload.new.id ? payload.new as Lot : l)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchLots() {
    setLoading(true)
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('name')
    if (error) setError(error.message)
    else setLots(data ?? [])
    setLoading(false)
  }

  // Filter by permit if provided, sort by occupancy ascending (best first)
  const filtered = permitFilter
    ? lots
        .filter(l => l.permits.includes(permitFilter))
        .sort((a, b) => occupancyPct(a) - occupancyPct(b))
    : lots.sort((a, b) => occupancyPct(a) - occupancyPct(b))

  return { lots: filtered, allLots: lots, loading, error, refetch: fetchLots }
}
