import { useEffect, useRef, useState } from 'react'
import { supabase, Report, LotStatus } from './supabase'

export function useReports(lotId?: string) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  // Unique channel name per hook instance (supabase reuses channels by name)
  const channelId = useRef(`reports-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    fetchReports()

    // Real-time subscription — new reports appear instantly
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          setReports(prev => [payload.new as Report, ...prev].slice(0, 50))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [lotId])

  async function fetchReports() {
    setLoading(true)
    let query = supabase
      .from('reports')
      .select('*, lot:lots(name, short_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (lotId) query = query.eq('lot_id', lotId)

    const { data } = await query
    setReports(data ?? [])
    setLoading(false)
  }

  async function submitReport(
    lotId: string,
    status: LotStatus,
    note: string
  ): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to submit a report.' }

    const { error } = await supabase.from('reports').insert({
      lot_id: lotId,
      user_id: user.id,
      status,
      note: note.trim() || null,
    })

    if (error) {
      // Surface the throttle error nicely
      if (error.message.includes('5 minutes')) {
        return { error: 'You already reported this lot recently. Wait 5 minutes.' }
      }
      return { error: error.message }
    }

    return { error: null }
  }

  async function upvoteReport(reportId: string): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Must be logged in.' }

    const { error } = await supabase.from('report_upvotes').insert({
      report_id: reportId,
      user_id: user.id,
    })

    if (error?.code === '23505') return { error: 'Already upvoted.' }
    if (error) return { error: error.message }

    // Optimistically update upvote count in local state
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r)
    )
    return { error: null }
  }

  return { reports, loading, submitReport, upvoteReport, refetch: fetchReports }
}
