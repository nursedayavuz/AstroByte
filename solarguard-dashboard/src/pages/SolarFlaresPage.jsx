import { motion } from 'framer-motion'
import FlareHistoryChart from '../components/charts/FlareHistoryChart'
import { formatDate, formatTime, getFlareColor } from '../utils/formatters'

export default function SolarFlaresPage({ recentFlares, alertState }) {
  const latestFlare = recentFlares[0]

  const classDistribution = recentFlares.reduce((acc, f) => {
    const letter = f.classType[0]
    acc[letter] = (acc[letter] || 0) + 1
    return acc
  }, {})

  const total = recentFlares.length
  const distColors = { X: '#ff2222', M: '#ff8c42', C: '#ffdc00' }

  return (
    <motion.div
      className="flex h-full gap-4 p-4 overflow-hidden"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
    >
      {/* LEFT 60% */}
      <div className="flex flex-col gap-4" style={{ flex: '0 0 60%' }}>
        {/* Flare History Chart */}
        <div className="glass-card p-4" style={{ height: 300 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            PATLAMA GEÇMİŞİ
          </div>
          <FlareHistoryChart data={recentFlares} height={250} />
        </div>

        {/* Recent Flare Table */}
        <div className="glass-card p-4 flex-1 overflow-auto">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
            SON PATLAMALAR
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Tarih/Saat', 'Sınıf', 'Süre', 'Kaynak', 'CME', 'SEP'].map(h => (
                  <th key={h} className="font-data" style={{ textAlign: 'left', padding: '8px 6px', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentFlares.map(flare => {
                const isX = flare.classType.startsWith('X')
                const isM = flare.classType.startsWith('M')
                const duration = Math.round((new Date(flare.endTime) - new Date(flare.beginTime)) / 60000)
                return (
                  <tr
                    key={flare.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${getFlareColor(flare.classType)}`,
                      background: isX ? 'rgba(255,34,34,0.05)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = isX ? 'rgba(255,34,34,0.05)' : 'transparent'}
                  >
                    <td className="font-code" style={{ padding: '8px 6px', fontSize: 10 }}>
                      {formatDate(flare.peakTime)} {formatTime(flare.peakTime)}
                    </td>
                    <td className="font-data" style={{ padding: '8px 6px', color: getFlareColor(flare.classType), fontWeight: 700 }}>
                      {flare.classType}
                    </td>
                    <td className="font-data" style={{ padding: '8px 6px', fontSize: 10 }}>{duration} dk</td>
                    <td style={{ padding: '8px 6px', fontSize: 10, color: 'var(--text-secondary)' }}>{flare.sourceLocation}</td>
                    <td style={{ padding: '8px 6px' }}>
                      {flare.linkedCME ? <span style={{ color: 'var(--cyan)', fontSize: 10 }}>✓</span> : <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      {flare.linkedSEP ? <span style={{ color: 'var(--orange)', fontSize: 10 }}>✓</span> : <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT 40% */}
      <div className="flex flex-col gap-4" style={{ flex: '0 0 38%' }}>
        {/* Current Solar Activity */}
        <div className="glass-card p-5">
          <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>SON PATLAMA</div>
          <div className="font-data glow-text" style={{ fontSize: 48, fontWeight: 700, color: 'var(--red)' }}>
            {alertState.current_flare}
          </div>
          <div className="font-data" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Bugün (T-1 Saat) / Güncel</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{alertState.active_region || '-'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Süre: -</div>
          <div className="flex gap-1 mt-3">
            {recentFlares.slice(0, 5).map((f, idx) => (
              <span key={`dot-${idx}`} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: getFlareColor(f.classType), display: 'inline-block',
              }} />
            ))}
          </div>
        </div>

        {/* Solar Cycle */}
        <div className="glass-card p-5">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
            Güneş Döngüsü 25 — Pik Aktivite Dönemi
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Mevcut Faz: Maksimum yakını (2025-2026)
          </div>
          <svg width="100%" height="60" viewBox="0 0 300 60">
            <path d="M 0 50 Q 50 50, 75 30 Q 100 10, 150 15 Q 180 10, 200 8 Q 230 10, 260 30 Q 290 50, 300 50" fill="none" stroke="var(--cyan-dim)" strokeWidth="2" />
            <circle cx="190" cy="10" r="5" fill="var(--cyan)" />
            <text x="190" y="55" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Space Mono">2025-26</text>
            <text x="20" y="55" textAnchor="middle" fill="var(--text-dim)" fontSize="7" fontFamily="Space Mono">2019</text>
            <text x="280" y="55" textAnchor="middle" fill="var(--text-dim)" fontSize="7" fontFamily="Space Mono">2030</text>
          </svg>
        </div>

        {/* Flare Distribution */}
        <div className="glass-card p-5">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
            SINIF DAĞILIMI
          </div>
          {Object.entries(classDistribution).map(([cls, count]) => (
            <div key={cls} className="flex items-center gap-2 mb-2">
              <span className="font-data" style={{ fontSize: 12, color: distColors[cls], width: 20, fontWeight: 700 }}>{cls}</span>
              <div className="flex-1" style={{ height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(count / total) * 100}%`,
                  background: distColors[cls], borderRadius: 4,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <span className="font-data" style={{ fontSize: 10, color: 'var(--text-muted)', width: 20 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* CME Association */}
        <div className="glass-card p-5">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>CME İLİŞKİSİ</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            X-class patlamaların CME ile ilişki oranı: <span className="font-data" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{alertState.cme_relation || '-'}</span><br/>
            Ortalama CME hızı: <span className="font-data" style={{ color: 'var(--text-primary)' }}>{alertState.avg_cme_speed || '-'}</span><br/>
            Ortalama varış süresi: <span className="font-data" style={{ color: 'var(--text-primary)' }}>{alertState.avg_eta || '-'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
