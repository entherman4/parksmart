import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await signInWithEmail(email)
    if (error) {
      setErrorMsg(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8F7F4', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)',
        padding: '40px 36px', width: '100%', maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: '#F5A623', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24
          }}>🅿</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>
              ParkSmart UMBC
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>Campus Parking Intelligence</div>
          </div>
        </div>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Check your email
            </div>
            <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              We sent a magic link to <strong>{email}</strong>.
              Click it to sign in — no password needed.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: 'block', fontFamily: 'Syne, sans-serif',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.8px', color: '#666', marginBottom: 8
              }}>
                UMBC Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your.name@umbc.edu"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {status === 'error' && (
              <div style={{
                background: '#FCE8E6', color: '#9B2A1E', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, marginBottom: 12
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email}
              style={{
                width: '100%', padding: '13px', background: '#1A1A1A',
                color: '#fff', border: 'none', borderRadius: 10,
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                cursor: status === 'loading' ? 'wait' : 'pointer',
                marginTop: 12, opacity: !email ? 0.5 : 1,
                transition: 'all .2s'
              }}
            >
              {status === 'loading' ? 'Sending…' : 'Send Magic Link →'}
            </button>

            <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16 }}>
              Only @umbc.edu addresses are allowed
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
