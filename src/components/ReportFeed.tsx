import { Report, LotStatus, timeAgo } from '../lib/supabase'

interface Props {
  reports: Report[]
  loading: boolean
  onUpvote: (reportId: string) => void
  filterLotId?: string
}

const STATUS_CONFIG: Record<LotStatus, { emoji: string; label: string; bg: string; color: string }> = {
  empty:       { emoji: '🟢', label: 'Empty',       bg: '#D1F5E8', color: '#0E6644' },
  available:   { emoji: '✅', label: 'Available',   bg: '#D1F5E8', color: '#0E6644' },
  filling:     { emoji: '🟡', label: 'Filling up',  bg: '#FEF3DC', color: '#9B6710' },
  almost_full: { emoji: '🟠', label: 'Almost full', bg: '#FEF3DC', color: '#9B6710' },
  full:        { emoji: '🔴', label: 'Full',        bg: '#FCE8E6', color: '#9B2A1E' },
  blocked:     { emoji: '🚧', label: 'Blocked',     bg: '#FCE8E6', color: '#9B2A1E' },
}

export default function ReportFeed({ reports, loading, onUpvote, filterLotId }: Props) {
  const filtered = filterLotId
    ? reports.filter(r => r.lot_id === filterLotId)
    : reports

  if (loading) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
        Loading reports…
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div style={{
        padding: '24px 16px', textAlign: 'center',
        background: '#F8F7F4', borderRadius: 10,
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          No reports yet
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          Be the first to report this lot's status
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {filtered.map(report => {
        const cfg = STATUS_CONFIG[report.status as LotStatus] ?? STATUS_CONFIG.available
        return (
          <div
            key={report.id}
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            {/* Top row: lot name + time */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 6,
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 12, color: '#444',
              }}>
                {(report.lot as any)?.name ?? 'Unknown lot'}
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {timeAgo(report.created_at)}
              </div>
            </div>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: cfg.bg, color: cfg.color,
              fontSize: 12, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20,
              fontFamily: 'Syne, sans-serif',
              marginBottom: report.note ? 6 : 8,
            }}>
              {cfg.emoji} {cfg.label}
            </div>

            {/* Note */}
            {report.note && (
              <div style={{
                fontSize: 12, color: '#555', marginBottom: 8,
                lineHeight: 1.5,
              }}>
                {report.note}
              </div>
            )}

            {/* Upvote row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onUpvote(report.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: '#F8F7F4', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif', fontWeight: 500,
                  color: '#555', transition: 'all .15s',
                }}
                title="Confirm this is accurate"
              >
                👍 {report.upvotes > 0 ? report.upvotes : ''} Confirm
              </button>
              <span style={{ fontSize: 11, color: '#aaa' }}>
                Tap to confirm this is accurate
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
