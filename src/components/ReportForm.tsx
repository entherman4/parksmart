import { useEffect, useState } from 'react'
import { Lot, LotStatus, STATUS_LABELS } from '../lib/supabase'

interface Props {
  lots: Lot[]
  defaultLotId?: string
  onSuccess?: () => void
  onSubmit: (lotId: string, status: LotStatus, note: string) => Promise<{ error: string | null }>
}

const STATUS_OPTIONS: { value: LotStatus; emoji: string; color: string }[] = [
  { value: 'empty',       emoji: '🟢', color: '#D1F5E8' },
  { value: 'available',   emoji: '✅', color: '#D1F5E8' },
  { value: 'filling',     emoji: '🟡', color: '#FEF3DC' },
  { value: 'almost_full', emoji: '🟠', color: '#FEF3DC' },
  { value: 'full',        emoji: '🔴', color: '#FCE8E6' },
  { value: 'blocked',     emoji: '🚧', color: '#FCE8E6' },
]

export default function ReportForm({ lots, defaultLotId, onSuccess, onSubmit }: Props) {
  const [lotId, setLotId]     = useState(defaultLotId ?? lots[0]?.id ?? '')
  const [status, setStatus]   = useState<LotStatus>('available')
  const [note, setNote]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // If lots finish loading after the form mounts, pick the first one
  useEffect(() => {
    if (!lotId && lots[0]) setLotId(lots[0].id)
  }, [lots, lotId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lotId) return
    setLoading(true)
    setError(null)

    const { error } = await onSubmit(lotId, status, note)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      setSuccess(true)
      setNote('')
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)
    }
  }

  if (success) {
    return (
      <div style={{
        textAlign: 'center', padding: '32px 20px',
        background: '#D1F5E8', borderRadius: 12,
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 15, color: '#0E6644'
        }}>
          Report submitted!
        </div>
        <div style={{ fontSize: 13, color: '#2D9B6F', marginTop: 4 }}>
          Thanks for helping the community
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Lot selector */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Parking Lot</label>
        <select
          value={lotId}
          onChange={e => setLotId(e.target.value)}
          style={selectStyle}
          required
        >
          {lots.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Status selector */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Current Status</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: status === opt.value
                  ? '2px solid #1A1A1A'
                  : '1px solid rgba(0,0,0,0.1)',
                background: status === opt.value ? opt.color : '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'Syne, sans-serif',
                fontWeight: status === opt.value ? 700 : 400,
                textAlign: 'left',
                transition: 'all .15s',
              }}
            >
              {opt.emoji} {STATUS_LABELS[opt.value]}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Note <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Upper deck still open"
          maxLength={120}
          style={{
            width: '100%', padding: '9px 12px',
            borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13, fontFamily: 'DM Sans, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{
          background: '#FCE8E6', color: '#9B2A1E', borderRadius: 8,
          padding: '10px 12px', fontSize: 13, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !lotId}
        style={{
          width: '100%', padding: '12px',
          background: loading ? '#888' : '#1A1A1A',
          color: '#fff', border: 'none', borderRadius: 8,
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 14, cursor: loading ? 'wait' : 'pointer',
          transition: 'all .2s',
        }}
      >
        {loading ? 'Submitting…' : 'Submit Report →'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Syne, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: '#666',
  marginBottom: 6,
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}
