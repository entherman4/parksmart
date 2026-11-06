import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '../lib/auth'
import { useLots } from '../lib/useLots'
import { useReports } from '../lib/useReports'
import LotCard from '../components/LotCard'
import PermitSelector, { PermitFilter } from '../components/PermitSelector'
import ReportForm from '../components/ReportForm'
import ReportFeed from '../components/ReportFeed'
import LoginPage from './login'

const CampusMap = dynamic(() => import('../components/CampusMap'), { ssr: false })

type Tab = 'map' | 'report'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [permit, setPermit]           = useState<PermitFilter>('ALL')
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [tab, setTab]                 = useState<Tab>('map')

  const { lots, allLots, loading: lotsLoading } = useLots(permit === 'ALL' ? undefined : permit)
  const { reports, loading: reportsLoading, submitReport, upvoteReport } = useReports()

  if (loading) return <LoadingScreen />
  if (!user) return <LoginPage />

  const effectivePermit: PermitFilter = permit

  return (
    <div style={{
      height: '100vh', display: 'grid',
      gridTemplateRows: 'auto 1fr',
      fontFamily: 'DM Sans, sans-serif',
      background: '#F8F7F4',
    }}>

      {/* Top bar */}
      <header style={{
        background: '#1A1A1A', color: '#fff',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#F5A623', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>🅿</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
              ParkSmart UMBC
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>Campus Parking</div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { id: 'map',    label: '🗺 Map' },
            { id: 'report', label: '📢 Report' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px', borderRadius: 6, border: 'none',
                background: tab === t.id ? '#F5A623' : 'rgba(255,255,255,0.08)',
                color: tab === t.id ? '#1A1A1A' : '#aaa',
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: 13, cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>{user.email}</span>
          <button
            onClick={signOut}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#ccc', padding: '6px 12px', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontFamily: 'Syne, sans-serif',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          background: '#fff', borderRight: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>

          {/* ── MAP TAB ── */}
          {tab === 'map' && (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <PermitSelector
                  selected={effectivePermit}
                  onChange={p => setPermit(p)}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  color: '#888', marginBottom: 10, padding: '0 2px',
                }}>
                  {lotsLoading
                    ? 'Loading lots…'
                    : effectivePermit === 'ALL'
                      ? `${lots.length} lots`
                      : `${lots.length} lots with ${effectivePermit} permit`}
                </div>

                {lots.map((lot, i) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    isSelected={selectedLotId === lot.id}
                    isRecommended={i === 0}
                    onClick={() => setSelectedLotId(lot.id === selectedLotId ? null : lot.id)}
                  />
                ))}
              </div>

              <div style={{
                padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#888',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#2D9B6F',
                  animation: 'pulse 2s infinite',
                }} />
                Live — updates automatically
              </div>
            </>
          )}

          {/* ── REPORT TAB ── */}
          {tab === 'report' && (
            <>
              {/* Submit form */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  color: '#888', marginBottom: 12,
                }}>
                  Submit lot status
                </div>
                <ReportForm
                  lots={allLots}
                  defaultLotId={selectedLotId ?? undefined}
                  onSuccess={() => {}}
                  onSubmit={submitReport}
                />
              </div>

              {/* Live feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  color: '#888', marginBottom: 10,
                }}>
                  Recent reports
                </div>
                <ReportFeed
                  reports={reports}
                  loading={reportsLoading}
                  onUpvote={upvoteReport}
                />
              </div>
            </>
          )}
        </aside>

        {/* Map — always rendered to keep state */}
        <main style={{
          position: 'relative', background: '#E4EAE0',
          display: tab === 'map' ? 'block' : 'none',
        }}>
          <CampusMap
            lots={lots}
            selectedLotId={selectedLotId}
            onSelectLot={id => setSelectedLotId(id === selectedLotId ? null : id)}
          />
        </main>

        {/* Report tab right panel — recent activity summary */}
        {tab === 'report' && (
          <div style={{
            background: '#F8F7F4', padding: 24,
            overflowY: 'auto',
          }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px',
              color: '#888', marginBottom: 16,
            }}>
              All lots — live status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {allLots.map(lot => {
                const pct = Math.round((lot.occupancy / lot.capacity) * 100)
                const color = pct < 50 ? '#2D9B6F' : pct < 80 ? '#E8A020' : '#D84C3A'
                const recentReports = reports.filter(r => r.lot_id === lot.id).length
                return (
                  <div
                    key={lot.id}
                    onClick={() => { setSelectedLotId(lot.id); setTab('map') }}
                    style={{
                      background: '#fff', borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.08)',
                      padding: '14px', cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{
                      fontFamily: 'Syne, sans-serif', fontWeight: 700,
                      fontSize: 13, marginBottom: 6,
                    }}>
                      {lot.short_name}
                    </div>
                    <div style={{ background: '#F0EEE8', borderRadius: 4, height: 6, marginBottom: 6 }}>
                      <div style={{ width: `${pct}%`, height: 6, background: color, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
                      <span style={{ color, fontWeight: 700 }}>{pct}% full</span>
                      <span>{recentReports} report{recentReports !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{
              marginTop: 20, padding: '14px', background: '#fff',
              borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
              fontSize: 12, color: '#888', lineHeight: 1.7,
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
                How reports work
              </div>
              Each report you submit updates the lot's occupancy estimate automatically.
              Reports from the last 30 minutes are weighted together to calculate the live number.
              Upvote reports that look accurate to boost their credibility.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8F7F4',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🅿</div>
        <div style={{ fontFamily: 'Syne, sans-serif', color: '#888' }}>Loading…</div>
      </div>
    </div>
  )
}
