import { Lot, occupancyPct, occupancyColor, occupancyLabel, timeAgo } from '../lib/supabase'

interface Props {
  lot: Lot
  isSelected: boolean
  isRecommended: boolean
  onClick: () => void
}

const PERMIT_COLORS: Record<string, string> = {
  A: '#E6F1FB', B: '#EAF3DE', C: '#FEF3DC', R: '#FBEAF0', V: '#EEEDFE'
}
const PERMIT_TEXT: Record<string, string> = {
  A: '#0C447C', B: '#27500A', C: '#633806', R: '#72243E', V: '#3C3489'
}

export default function LotCard({ lot, isSelected, isRecommended, onClick }: Props) {
  const pct = occupancyPct(lot)
  const color = occupancyColor(pct)
  const label = occupancyLabel(pct)

  return (
    <div
      onClick={onClick}
      style={{
        border: isSelected ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: '14px',
        marginBottom: 8,
        cursor: 'pointer',
        background: isSelected ? `${color}10` : '#fff',
        transition: 'all .15s',
        position: 'relative',
      }}
    >
      {isRecommended && (
        <div style={{
          position: 'absolute', top: -1, right: 12,
          background: '#F5A623', color: '#1A1A1A',
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: '0 0 6px 6px', fontFamily: 'Syne, sans-serif',
          letterSpacing: '0.5px'
        }}>
          ⭐ BEST
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
          {lot.name}
        </div>
        <div style={{
          background: `${color}20`, color: color,
          fontSize: 11, fontWeight: 700, padding: '2px 8px',
          borderRadius: 20, fontFamily: 'Syne, sans-serif', flexShrink: 0
        }}>
          {label}
        </div>
      </div>

      {/* Occupancy bar */}
      <div style={{ background: '#F0EEE8', borderRadius: 4, height: 6, marginBottom: 8 }}>
        <div style={{
          width: `${pct}%`, height: 6, background: color,
          borderRadius: 4, transition: 'width .5s'
        }} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666', marginBottom: 8 }}>
        <span>{pct}% full</span>
        <span>·</span>
        <span>{lot.capacity - lot.occupancy} spots left</span>
        <span>·</span>
        <span>Updated {timeAgo(lot.updated_at)}</span>
      </div>

      {/* Permit tags */}
      <div style={{ display: 'flex', gap: 4 }}>
        {lot.permits.map(p => (
          <span key={p} style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 10,
            background: PERMIT_COLORS[p] ?? '#F0EEE8',
            color: PERMIT_TEXT[p] ?? '#555',
            fontWeight: 600, fontFamily: 'Syne, sans-serif'
          }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
