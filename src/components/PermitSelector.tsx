import { PermitType } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export type PermitFilter = PermitType | 'ALL'

const PERMITS: { value: PermitFilter; label: string; desc: string }[] = [
  { value: 'ALL', label: 'All lots', desc: 'Show every lot' },
  { value: 'A', label: 'Lot A',     desc: 'All surface lots' },
  { value: 'B', label: 'Lot B',     desc: 'Selected surface lots' },
  { value: 'C', label: 'Lot C',     desc: 'Commuter lots' },
  { value: 'R', label: 'Resident',  desc: 'On-campus residents' },
  { value: 'V', label: 'Visitor',   desc: 'Visitor / daily' },
]

interface Props {
  selected: PermitFilter
  onChange: (p: PermitFilter) => void
}

export default function PermitSelector({ selected, onChange }: Props) {
  const { updatePermit } = useAuth()

  function handleChange(p: PermitFilter) {
    onChange(p)
    // Only real permits are saved to the profile; "All lots" is just a view
    if (p !== 'ALL') updatePermit(p)
  }

  return (
    <div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1px',
        color: '#888', marginBottom: 8
      }}>
        Filter by permit
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PERMITS.map(p => (
          <button
            key={p.value}
            onClick={() => handleChange(p.value)}
            title={p.desc}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: selected === p.value
                ? '1.5px solid #B87A0F'
                : '1px solid rgba(0,0,0,0.1)',
              background: selected === p.value ? '#FEF3DC' : '#fff',
              color: selected === p.value ? '#B87A0F' : '#666',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
