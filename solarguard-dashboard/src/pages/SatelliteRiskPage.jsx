import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import RiskBar from '../components/shared/RiskBar'
import StarlinkComparison from '../components/cards/StarlinkComparison'
import { getRiskColor } from '../utils/formatters'
import { RISK_TYPE_LABELS } from '../utils/constants'

export default function SatelliteRiskPage({ satellites = [] }) {
  const [expandedId, setExpandedId] = useState(null)
  const [apmStates, setApmStates] = useState({})
  const sorted = [...satellites].sort((a, b) => (b.risk || 0) - (a.risk || 0))

  const triggerApm = (id) => {
    setApmStates(prev => ({...prev, [id]: 'connecting'}))
    setTimeout(() => setApmStates(prev => ({...prev, [id]: 'executing'})), 800)
    setTimeout(() => setApmStates(prev => ({...prev, [id]: 'completed'})), 2500)
  }

  return (
    <motion.div
      className="flex flex-col h-full p-4 gap-4 overflow-auto"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
    >
      {/* Fleet Overview */}
      <div className="flex gap-4" style={{ height: 80 }}>
        {satellites.map(sat => {
          const color = getRiskColor(sat.level)
          return (
            <div key={sat.id} className="flex-1 glass-card p-3 flex items-center gap-3">
              <div className="flex-1">
                <div style={{ fontSize: 11, fontWeight: 700 }}>{sat.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-data" style={{ fontSize: 9, color: sat.orbit === 'GEO' ? 'var(--blue)' : 'var(--green)', padding: '1px 6px', borderRadius: 4, border: `1px solid ${sat.orbit === 'GEO' ? 'var(--blue)' : 'var(--green)'}` }}>
                    {sat.orbit}
                  </span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                </div>
              </div>
              <div className="font-data" style={{ fontSize: 22, fontWeight: 700, color }}>{Math.round(sat.risk * 100)}%</div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left: Satellite Detail Cards */}
        <div className="flex flex-col gap-4 overflow-auto" style={{ flex: '0 0 55%' }}>
          {satellites.map(sat => {
            const color = getRiskColor(sat.level)
            return (
              <div key={sat.id} className="glass-card p-4" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>satellite_alt</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{sat.name}</span>
                  </div>
                  <span className="font-data" style={{ fontSize: 10, color: sat.orbit === 'GEO' ? 'var(--blue)' : 'var(--green)', padding: '2px 10px', borderRadius: 4, border: `1px solid ${sat.orbit === 'GEO' ? 'var(--blue)' : 'var(--green)'}` }}>
                    {sat.orbit} {(sat.alt_km || 0).toLocaleString()} km
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>Operatör: {sat.operator}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Risk:</span>
                  <div className="flex-1"><RiskBar value={sat.risk} level={sat.level} /></div>
                  <span className="font-data" style={{ fontSize: 12, color, fontWeight: 700 }}>{Math.round(sat.risk * 100)}%</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Risk Türü: {RISK_TYPE_LABELS[sat.risk_type] || sat.risk_type}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Hizmetler: {sat.services?.join(', ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                  Önerilen Eylem: {sat.orbit === 'GEO' ? 'GEO uyduları için güvenli mod aktivasyonu' : 'Yörünge izleme ve drag tahmini'}
                </div>

                {/* Risk Factor Bars — derived from API risk_score */}
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 100 }}>X-ışını etkisi</span>
                    <div className="flex-1" style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(Math.round(sat.risk * 100 * 1.2), 100)}%`, height: '100%', background: 'var(--red)', borderRadius: 3 }} />
                    </div>
                    <span className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{Math.min(Math.round(sat.risk * 100 * 1.2), 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 100 }}>Kp geomagnetik</span>
                    <div className="flex-1" style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(Math.round(sat.risk * 100 * 0.85), 100)}%`, height: '100%', background: 'var(--orange)', borderRadius: 3 }} />
                    </div>
                    <span className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{Math.min(Math.round(sat.risk * 100 * 0.85), 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 100 }}>Kritiklik ağırlığı</span>
                    <div className="flex-1" style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ width: `${sat.criticality * 100}%`, height: '100%', background: 'var(--cyan)', borderRadius: 3 }} />
                    </div>
                    <span className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{Math.round(sat.criticality * 100)}%</span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === sat.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="mt-4 p-3 rounded" style={{ background: 'rgba(0,0,0,0.3)', border: '1px outset rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 8, letterSpacing: '0.1em' }} className="font-display">
                          DERİN ANALİZ & OTONOM APM YÖNETİMİ
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>GÜNEŞ RÜZGARI BASINCI</div>
                            <div className="font-data" style={{ fontSize: 11, color: sat.risk > 0.5 ? 'var(--orange)' : 'var(--green)' }}>{(sat.risk * 8.5).toFixed(1)} nPa ({sat.risk > 0.5 ? 'Kritik' : 'Normal'})</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>SÜRÜKLENME (DRAG) ARTIŞI</div>
                            <div className="font-data" style={{ fontSize: 11, color: sat.risk > 0.4 ? 'var(--red)' : 'var(--green)' }}>+%{Math.round(sat.risk * 60)} ({sat.risk > 0.4 ? 'Yörünge Kaybı Riski' : 'Stabil'})</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>YÜZEY ŞARJLANMASI (kV)</div>
                            <div className="font-data" style={{ fontSize: 11, color: sat.risk > 0.6 ? 'var(--red)' : 'var(--green)' }}>{(sat.risk * 3.5).toFixed(1)} kV ({sat.risk > 0.6 ? 'Tehlike' : 'Nominal'})</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>SİSTEM DURUMU</div>
                            <div className="font-data" style={{ fontSize: 11, color: sat.risk > 0.7 ? 'var(--red)' : 'var(--text-primary)' }}>{sat.risk > 0.7 ? 'SAFE MODE GEREKLİ' : 'AUTO-SAFE READY'}</div>
                          </div>
                        </div>
                        {apmStates[sat.id] ? (
                          <div className="font-code mt-2 p-2 rounded" style={{ background: '#000', border: '1px solid var(--border-accent)', color: 'var(--green)', fontSize: 9 }}>
                            <div>[SYS] Handshake with TÜRKSAT-Hub... <span style={{color: 'var(--cyan)'}}>OK</span></div>
                            {(apmStates[sat.id] === 'executing' || apmStates[sat.id] === 'completed') && (
                              <div className="mt-1">
                                <div>[APM] Uplinking Payload: 0x4F4C2...</div>
                                <div style={{ color: 'var(--orange)' }}>{`{ "cmd": "SET_ATTITUDE", "pitch": 45, "array_feathering": true, "transponder": "STBY" }`}</div>
                              </div>
                            )}
                            {apmStates[sat.id] === 'completed' && (
                              <div style={{ color: 'var(--cyan)', marginTop: 4 }}>&gt; APM PROTOCOL ENGAGED. SATELLITE SECURED.</div>
                            )}
                          </div>
                        ) : (
                          <button className="w-full flex items-center justify-center gap-2" style={{
                            background: 'rgba(255,34,34,0.1)',
                            border: '1px solid var(--red)',
                            padding: '8px',
                            color: 'var(--red)',
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => triggerApm(sat.id)}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,34,34,0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255,34,34,0.3)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,34,34,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span>
                            OTONOM GÜVENLİ MOD (APM) PROTOKOLÜNÜ BAŞLAT
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div 
                  className="mt-3 flex justify-center items-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}
                  onClick={() => setExpandedId(expandedId === sat.id ? null : sat.id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-dim)' }}>
                    {expandedId === sat.id ? 'expand_less' : 'expand_more'}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 4 }}>
                    {expandedId === sat.id ? 'Detayları Gizle' : 'Derin Analiz & Aksiyonlar'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Risk Comparison Chart */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 43%' }}>
          <div className="glass-card p-4">
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
              RİSK KARŞILAŞTIRMASI
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sorted} layout="vertical" margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" domain={[0, 1]} stroke="var(--text-dim)" tick={{ fontSize: 9, fill: 'var(--text-dim)', fontFamily: "'Space Mono'" }} />
                <YAxis type="category" dataKey="name" stroke="var(--text-dim)" tick={{ fontSize: 9, fill: 'var(--text-secondary)', fontFamily: "'Space Mono'" }} width={80} />
                <Tooltip contentStyle={{ background: 'rgba(5,6,15,0.95)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 10, fontFamily: "'Space Mono'" }} />
                <ReferenceLine x={0.4} stroke="var(--alert-yellow)" strokeDasharray="5 5" />
                <ReferenceLine x={0.7} stroke="var(--alert-red)" strokeDasharray="5 5" />
                <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                  {sorted.map((s, i) => (
                    <Cell key={i} fill={getRiskColor(s.level)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <StarlinkComparison />
        </div>
      </div>
    </motion.div>
  )
}
