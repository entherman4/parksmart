import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

// Supabase redirects here after the user clicks the magic link in their email
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // The URL will contain a code or token — Supabase handles it automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
      else router.replace('/login')
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8F7F4'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🅿</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, color: '#666' }}>
          Signing you in…
        </div>
      </div>
    </div>
  )
}
