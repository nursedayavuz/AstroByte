import React, { useState } from 'react'
import { motion } from 'framer-motion'
import EarthGlobe from '../components/globe/EarthGlobe'
import GlobeControls from '../components/globe/GlobeControls'
import KpForecastChart from '../components/charts/KpForecastChart'
import EventLogEntry from '../components/cards/EventLogEntry'
import RiskBar from '../components/shared/RiskBar'
import { useSettings } from '../contexts/SettingsContext'
import { createTranslator } from '../utils/translations'

class GlobeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Globe crashed:", error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)'}}>3D Render Error - Düştü</div>;
    }
    return this.props.children;
  }
}

export default function DashboardPage({ satellites, groundAssets, alertState, forecastSeries, eventLog }) {
  const { settings } = useSettings()
  const t = createTranslator(settings.language)
  
  const [toggles, setToggles] = useState({ orbits: true, aurora: true, cme: false, heatmap: false })
  const [swarmFilter, setSwarmFilter] = useState('ALL')
  const [timeMultiplier, setTimeMultiplier] = useState(1)

  const handleToggle = (key) => {
    if (key === 'reset') {
      setToggles({ orbits: true, aurora: true, cme: false, heatmap: false })
      return
    }
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleZoom = (direction) => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.dispatchEvent(new WheelEvent('wheel', {
        deltaY: direction === 'in' ? -500 : 500,
        bubbles: true,
      }))
    }
  }

  const affectedCount = satellites.filter(s => s.risk > 0.5).length

  const getThreatInfo = (kp) => {
    if (kp >= 7) return { level: 'RED', label: t('TEHLİKE: Şiddetli Jeomanyetik Fırtına', 'DANGER: Severe Geomagnetic Storm'), color: 'var(--red)', glow: 'rgba(255, 34, 34, 0.4)', icon: 'gpp_maybe' }
    if (kp >= 5) return { level: 'ORANGE', label: t('UYARI: G3 Sınıfı Fırtına Etkisi', 'WARNING: G3 Class Storm Impact'), color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.4)', icon: 'warning' }
    if (kp >= 4) return { level: 'YELLOW', label: t('DİKKAT: Aktif Uzay Havası', 'CAUTION: Active Space Weather'), color: '#ffee00', glow: 'rgba(255, 238, 0, 0.2)', icon: 'info' }
    return { level: 'GREEN', label: t('NORMAL: Stabil Uzay Havası', 'NORMAL: Stable Space Weather'), color: 'var(--green)', glow: 'rgba(0, 255, 136, 0.2)', icon: 'check_circle' }
  }

  const threat = getThreatInfo(alertState.kp_current)

  return (
    <motion.div
      className="dashboard-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Globe Area */}
      <div className="dashboard-globe-area" style={{ position: 'relative' }}>
        <GlobeErrorBoundary>
          <EarthGlobe
            satellites={satellites}
            groundAssets={groundAssets}
            kpIndex={alertState.kp_current}
            toggles={toggles}
            swarmFilter={swarmFilter}
            timeMultiplier={timeMultiplier}
            backendEnabled={settings.backendEnabled}
          />
        </GlobeErrorBoundary>

        {/* TOP-LEFT Prominent Floating Panel */}
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 20, pointerEvents: 'auto' }}>
          <div className="glass-strong p-4" style={{ 
            borderRadius: 12, 
            width: 240,
            border: '1px solid rgba(0, 255, 240, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 255, 240, 0.1), inset 0 0 20px rgba(0, 255, 240, 0.05)',
            background: 'linear-gradient(135deg, rgba(5,6,15,0.85) 0%, rgba(0,20,40,0.85) 100%)'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--cyan)' }}>satellite_alt</span>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{t('TUA UYDU RİSKİ', 'TUA SATELLITE RISK')}</span>
            </div>
            <RiskBar value={affectedCount > 0 ? (affectedCount / Math.max(satellites.length, 1)) : 0} level={affectedCount > 0 ? 'RED' : 'GREEN'} className="mb-3" />
            <div className="font-data" style={{ fontSize: 11, color: affectedCount > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }} aria-live="polite">
              {affectedCount} {t('UYDU ETKİLENİYOR', 'SATELLITES AFFECTED')}
            </div>
          </div>
        </div>

        {/* RIGHT Vertical Zoom Slider */}
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 20, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => handleZoom('in')}
            aria-label="Yakınlaştır"
            className="flex items-center justify-center glass-card hover:bg-white/10"
            style={{ width: 36, height: 36, borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          </button>
          
          <div style={{ width: 4, height: 80, background: 'linear-gradient(to bottom, var(--border-accent), var(--border-subtle))', borderRadius: 2, margin: '4px 0' }} />
          
          <button
            onClick={() => handleZoom('out')}
            aria-label="Uzaklaştır"
            className="flex items-center justify-center glass-card hover:bg-white/10"
            style={{ width: 36, height: 36, borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>remove</span>
          </button>
        </div>

        {/* BOTTOM-CENTER Globe Controls */}
        <div className="dashboard-float-bc" style={{ pointerEvents: 'auto', zIndex: 50, position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <GlobeControls 
            toggles={toggles} 
            onToggle={handleToggle}
            swarmFilter={swarmFilter}
            onSwarmFilterChange={setSwarmFilter}
            timeMultiplier={timeMultiplier}
            onTimeMultiplierChange={setTimeMultiplier}
          />
        </div>
      </div>

      {/* Right Panel — Kp Chart + Event Log only */}
      <div className="dashboard-right-panel">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            {t('Kp TAHMİN GRAFİĞİ', 'Kp FORECAST CHART')}
          </div>
          <div className="glass-card p-3" style={{ height: 200, width: '100%', minWidth: 0 }} aria-label="Kp İndeksi tahmin grafiği">
            <KpForecastChart data={forecastSeries} height={180} mini />
          </div>
        </div>

        {/* Live Telemetry Panel */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            {t('CANLI UZAY HAVASI TELEMETRİSİ', 'LIVE SPACE WEATHER TELEMETRY')}
          </div>
          <div className="glass-card p-3 grid grid-cols-2 gap-2" style={{ background: 'rgba(0, 20, 40, 0.4)', border: '1px solid var(--border-medium)' }}>
            <div className="flex flex-col gap-1 p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>GÜNEŞ RÜZGARI</span>
              <span className="font-data" style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 800 }}>{alertState.solar_wind != null ? alertState.solar_wind.toFixed(1) : '-'} <span style={{fontSize:9}}>km/s</span></span>
            </div>
            <div className="flex flex-col gap-1 p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>PLAZMA YOĞUNLUĞU</span>
              <span className="font-data" style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 800 }}>{alertState.density != null ? alertState.density.toFixed(2) : '-'} <span style={{fontSize:9}}>p/cm³</span></span>
            </div>
            <div className="flex flex-col gap-1 p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>MANYETİK ALAN (Bz)</span>
              <span className="font-data" style={{ fontSize: 14, color: alertState.bz_gsm != null && alertState.bz_gsm < -5 ? 'var(--red)' : 'var(--cyan)', fontWeight: 800 }}>{alertState.bz_gsm != null ? alertState.bz_gsm.toFixed(2) : '-'} <span style={{fontSize:9}}>nT</span></span>
            </div>
            <div className="flex flex-col gap-1 p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>PROTON AKIŞI</span>
              <span className="font-data" style={{ fontSize: 14, color: 'var(--cyan)', fontWeight: 800 }}>{alertState.proton_flux != null ? alertState.proton_flux.toFixed(2) : '-'} <span style={{fontSize:9}}>p/cm³</span></span>
            </div>
            <div className="flex flex-col gap-1 p-2" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, gridColumn: 'span 2' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>KP GERÇEK ZAMANLI</span>
              <span className="font-data" style={{ fontSize: 16, color: alertState.kp_current != null && alertState.kp_current >= 5 ? 'var(--red)' : alertState.kp_current != null && alertState.kp_current >= 4 ? '#ffaa00' : 'var(--cyan)', fontWeight: 800 }}>{alertState.kp_current != null ? alertState.kp_current.toFixed(1) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Digital Twin Simulation GNSS */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            {t('DİJİTAL İKİZ: GNSS HATA SİMÜLASYONU', 'DIGITAL TWIN: GNSS ERROR SIMULATION')}
          </div>
          <div className="glass-card p-3 flex flex-col gap-2" style={{ background: alertState.kp_current >= 7 ? 'rgba(255, 34, 34, 0.1)' : 'rgba(0, 255, 240, 0.05)', border: `1px solid ${alertState.kp_current >= 7 ? 'var(--red)' : 'var(--border-medium)'}` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Sapma Payı Tahmini</span>
              <span className="font-data" style={{ fontSize: 16, color: alertState.kp_current >= 7 ? 'var(--red)' : 'var(--cyan)', fontWeight: 800 }}>
                ±{alertState.kp_current != null ? (alertState.kp_current >= 7 ? '18.4' : alertState.kp_current >= 5 ? '6.2' : '1.2') : '-'} m
              </span>
            </div>
            <RiskBar value={alertState.kp_current / 9} level={alertState.kp_current >= 7 ? 'RED' : alertState.kp_current >= 5 ? 'YELLOW' : 'GREEN'} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
              {alertState.kp_current >= 7 
                ? 'Kritik uyarı: L1/L2 bantlarında ciddi sinyal kayıpları ve iyonosferik sintilasyon. İHA ve otonom tarım sistemlerinde %40 rota sapması riski.' 
                : 'Sintilasyon seviyesi normal bant aralığında. Sinyal kilitlenmesi stabil.'}
            </div>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            {t('OLAY GEÇMİŞİ', 'EVENT HISTORY')}
          </div>
          <div role="log" aria-label="Uzay hava olayları geçmişi" aria-live="polite">
            {eventLog.map(entry => (
              <EventLogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
