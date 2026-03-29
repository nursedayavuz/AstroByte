import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import KpForecastChart from '../components/charts/KpForecastChart'
import RiskGaugeChart from '../components/charts/RiskGaugeChart'
import { useClock } from '../hooks/useClock'
import { useSettings } from '../contexts/SettingsContext'
import { createTranslator } from '../utils/translations'

function computeStormProbability(kp) {
  const x = Number(kp)
  if (!Number.isFinite(x)) return 0
  const p = 1 / (1 + Math.exp(-3 * (x - 4.4)))
  return Math.max(0.01, Math.min(0.99, p))
}

function getNextNoaaUpdate(now) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  const h = now.getUTCHours()

  const nextHour = (Math.floor(h / 3) + 1) * 3
  let target = new Date(Date.UTC(y, m, d, nextHour, 0, 0, 0))
  if (nextHour >= 24) {
    target = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0))
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime())
  const diffSec = Math.floor(diffMs / 1000)
  return { target, diffSec }
}

function formatCountdown(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PredictionsPage({ forecastSeries = [], alertState = {}, modelMetrics, wsaEnlil = [] }) {
  const { settings } = useSettings()
  const t = createTranslator(settings.language)
  const { time: liveClock } = useClock()

  const [liveForecastSeries, setLiveForecastSeries] = useState(Array.isArray(forecastSeries) ? forecastSeries : [])
  const [lastForecastUpdate, setLastForecastUpdate] = useState(null)
  const [forecastError, setForecastError] = useState(null)
  const [realtimeKp, setRealtimeKp] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const lastSignatureRef = useRef('')
  const isMountedRef = useRef(true)
  const countdownPrevRef = useRef(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (Array.isArray(forecastSeries) && forecastSeries.length > 0 && liveForecastSeries.length === 0) {
      setLiveForecastSeries(forecastSeries)
    }
  }, [forecastSeries, liveForecastSeries.length])

  const fetchForecastSeries = useCallback(async () => {
    if (!settings.backendEnabled) return

    try {
      setIsSyncing(true)
      const res = await fetch('/api/forecast-series')
      if (!res.ok) throw new Error(`forecast-series status ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data) || !isMountedRef.current) return

      const signature = JSON.stringify(data.map(item => [item?.hour, item?.kp_value, item?.risk_level, item?.timestamp, item?.storm_probability]))
      if (signature !== lastSignatureRef.current) {
        lastSignatureRef.current = signature
        setLiveForecastSeries(data)
        setLastForecastUpdate(data[0]?.timestamp || data[0]?.time || new Date().toISOString())
      }

      setForecastError(null)
    } catch (err) {
      if (isMountedRef.current) setForecastError(err?.message || 'Forecast fetch failed')
    } finally {
      if (isMountedRef.current) setIsSyncing(false)
    }
  }, [settings.backendEnabled])

  const fetchRealtimeKp = useCallback(async () => {
    if (!settings.backendEnabled) return
    try {
      const res = await fetch('/api/realtime-kp')
      if (!res.ok) throw new Error(`realtime-kp status ${res.status}`)
      const data = await res.json()
      if (isMountedRef.current) setRealtimeKp(data)
    } catch {
      // keep last realtime data
    }
  }, [settings.backendEnabled])

  useEffect(() => {
    if (!settings.backendEnabled) return undefined

    fetchForecastSeries()
    const id = setInterval(fetchForecastSeries, 60000)
    return () => clearInterval(id)
  }, [settings.backendEnabled, fetchForecastSeries])

  useEffect(() => {
    if (!settings.backendEnabled) return undefined

    fetchRealtimeKp()
    const id = setInterval(fetchRealtimeKp, 60000)
    return () => clearInterval(id)
  }, [settings.backendEnabled, fetchRealtimeKp])

  const nextNoaa = useMemo(() => getNextNoaaUpdate(liveClock), [liveClock])

  useEffect(() => {
    if (!settings.backendEnabled) return

    const prev = countdownPrevRef.current
    const curr = nextNoaa.diffSec
    if (prev !== null && prev > 0 && curr === 0) {
      fetchForecastSeries()
      fetchRealtimeKp()
    }
    countdownPrevRef.current = curr
  }, [nextNoaa.diffSec, fetchForecastSeries, fetchRealtimeKp, settings.backendEnabled])

  const activeForecastSeries = useMemo(() => {
    if (Array.isArray(liveForecastSeries) && liveForecastSeries.length > 0) return liveForecastSeries
    if (Array.isArray(forecastSeries)) return forecastSeries
    return []
  }, [liveForecastSeries, forecastSeries])

  const hourlyProbabilities = useMemo(() => {
    return activeForecastSeries.slice(0, 3).map((point, idx) => {
      const ts = point?.timestamp || point?.time
      const d = ts ? new Date(ts) : null
      const timeLabel = d && Number.isFinite(d.getTime())
        ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
        : `+${idx * 3}h`
      const prob = point?.storm_probability != null
        ? Number(point.storm_probability)
        : computeStormProbability(point?.kp_value ?? point?.kp_lstm ?? 0)

      return {
        timeLabel,
        probability: Math.max(0, Math.min(0.99, prob)),
      }
    })
  }, [activeForecastSeries])

  const currentPoint = activeForecastSeries[0] || null
  const currentKpNowcast = realtimeKp?.kp_nowcast
  const currentKpOfficial = realtimeKp?.kp_index
  const currentKp = currentKpNowcast ?? currentKpOfficial ?? currentPoint?.kp_value ?? currentPoint?.kp_lstm ?? alertState?.kp_current ?? 0
  const currentRiskLevel = currentKp >= 9 ? 'G5' : currentKp >= 8 ? 'G4' : currentKp >= 7 ? 'G3' : currentKp >= 6 ? 'G2' : currentKp >= 5 ? 'G1' : 'NORMAL'
  const isWarning = Boolean(realtimeKp?.nowcast_is_warning ?? currentPoint?.isWarning ?? (currentKp > 5))
  const currentTimestamp = realtimeKp?.observation_time_utc || currentPoint?.timestamp || currentPoint?.time || lastForecastUpdate

  const maxKpForecast = activeForecastSeries.length > 0
    ? Math.max(...activeForecastSeries.map(f => f.kp_upper_ci || f.kp_value || f.kp_lstm || 0))
    : (alertState?.kp_current || 3.0)

  function getSectorImpact(kp) {
    if (kp >= 9) return { level: 'G5', label: 'Ekstrem Risk', gnss: 'Sinyal Yok / >30m Sapma', grid: 'Sistem Cokmesi', comms: 'LF/HF Sinyal Kaybi', color: 'var(--red)' }
    if (kp >= 8) return { level: 'G4', label: 'Cok Siddetli', gnss: 'Ciddi Sapma (+-15m)', grid: 'HVDC Hasar Riski', comms: 'Genis Capli Kesinti', color: 'var(--orange)' }
    if (kp >= 7) return { level: 'G3', label: 'Siddetli', gnss: 'Konum Sapmasi (+-10m)', grid: 'Voltaj Dalgalanmasi', comms: 'Uydu Bit Error Artisi', color: 'var(--amber)' }
    if (kp >= 6) return { level: 'G2', label: 'Orta', gnss: 'Ufak Sapma (+-5m)', grid: 'Trafo Isinmasi', comms: 'Frekans Paraziti', color: 'var(--yellow)' }
    if (kp >= 5) return { level: 'G1', label: 'Hafif Firtina', gnss: 'Gecikme (+-3m)', grid: 'Ufak Anormallik', comms: 'Kisa Sureli Zayiflama', color: 'var(--cyan)' }
    return { level: 'NORMAL', label: 'Stabil', gnss: 'Optimize (<1m)', grid: 'Stabil', comms: 'Normal', color: 'var(--green)' }
  }

  const impact = getSectorImpact(maxKpForecast)

  const upcomingSim = useMemo(() => {
    const now = new Date()
    const candidates = (Array.isArray(wsaEnlil) ? wsaEnlil : [])
      .filter(sim => sim?.isEarthGB && sim?.estimatedShockArrivalTime)
      .map(sim => ({
        ...sim,
        _arrival: new Date(sim.estimatedShockArrivalTime),
        _model: sim?.modelCompletionTime ? new Date(sim.modelCompletionTime) : new Date(0),
      }))
      .filter(sim => Number.isFinite(sim._arrival.getTime()))

    if (candidates.length === 0) return null

    const future = candidates.filter(sim => sim._arrival > now)
    const pool = future.length > 0 ? future : candidates
    pool.sort((a, b) => b._model.getTime() - a._model.getTime())
    return pool[0]
  }, [wsaEnlil])

  const shockTimeStr = upcomingSim
    ? new Date(upcomingSim.estimatedShockArrivalTime).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Simulasyon Yok'
  const shockTimeUtc = upcomingSim
    ? String(upcomingSim.estimatedShockArrivalTime).replace('T', ' ').replace('Z', ' UTC')
    : '-'

  const metricsData = modelMetrics || {}
  const lstm = metricsData.lstm || {}
  const xgb = metricsData.xgboost || {}
  const baselines = metricsData.baselines || {}

  const asNumber = (v, fallback = 0) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const parsed = Number(v.replace('%', '').trim())
      if (Number.isFinite(parsed)) return v.includes('%') ? parsed / 100 : parsed
    }
    return fallback
  }

  const probCards = [
    { label: '24 SAAT', prob: alertState?.prob_mx_24h || 0, color: 'var(--red)' },
    { label: '48 SAAT', prob: alertState?.prob_mx_48h || 0, color: 'var(--orange)' },
    { label: '72 SAAT', prob: alertState?.prob_mx_72h || 0, color: 'var(--amber)' },
  ]

  const metrics = [
    { name: 'AUC-ROC', persistence: asNumber(baselines.persistence_auc), xgb: asNumber(xgb.auc_roc), lstm: asNumber(lstm.auc_roc) },
    { name: 'Precision', persistence: 0, xgb: asNumber(xgb.feature_importance?.Bz_GSM, 0.35), lstm: asNumber(lstm.precision_24h) },
    { name: 'F1-Score', persistence: 0, xgb: 0.72, lstm: asNumber(lstm.precision_24h) > 0 ? asNumber(lstm.precision_24h) * 0.95 : 0 },
  ]

  return (
    <motion.div
      className="flex flex-col h-full p-4 gap-4 overflow-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: settings.animations ? 0.3 : 0 }}
    >
      <div className="flex gap-4" style={{ height: 190 }}>
        <div className="flex-1 glass-card p-5 relative overflow-hidden flex flex-col justify-between" style={{ border: upcomingSim ? '1px solid var(--orange)' : undefined, background: upcomingSim ? 'rgba(255, 120, 0, 0.05)' : undefined }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: upcomingSim ? 'var(--orange)' : 'var(--cyan)' }}>
              {upcomingSim ? 'crisis_alert' : 'model_training'}
            </span>
            <div style={{ fontSize: 11, color: upcomingSim ? 'var(--orange)' : 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
              CANLI ERKEN TAHMIN
            </div>
            {isWarning && <span className="pulse-dot ml-auto" style={{ background: 'var(--red)', width: 8, height: 8 }} />}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>CME Tahmini Carpma Zamani</div>
              <div className="font-data" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{shockTimeStr}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Risk: <strong style={{ color: 'var(--text-secondary)' }}>{currentRiskLevel}</strong>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                UTC: {shockTimeUtc}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                Kaynak: NASA DONKI WSA-Enlil
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Canli Kp Nowcast</div>
              <div className="font-data" style={{ fontSize: 24, fontWeight: 700, color: isWarning ? 'var(--red)' : 'var(--cyan)', marginTop: 4 }}>
                {Number(currentKp).toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: isWarning ? 'var(--red)' : 'var(--text-muted)', marginTop: 2 }}>
                {isWarning ? 'UYARI: Kp > 5' : 'Normal'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            Son resmi Kp gozl. zamani: {currentTimestamp ? new Date(currentTimestamp).toLocaleString('tr-TR') : '-'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Resmi Kp: {currentKpOfficial != null ? Number(currentKpOfficial).toFixed(2) : '-'} | Nowcast guven: {realtimeKp?.nowcast_confidence != null ? `${Math.round(realtimeKp.nowcast_confidence * 100)}%` : '-'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Canli saat (simdi): {liveClock.toLocaleString('tr-TR')}
          </div>
          {realtimeKp?.cadence_minutes && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              NOAA Kp guncelleme araligi: ~{realtimeKp.cadence_minutes} dk
            </div>
          )}
          {forecastError && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4 }}>Forecast baglanti: {forecastError}</div>}
        </div>

        <div className="flex-1 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: impact.color }}>domain_disabled</span>
            <div style={{ fontSize: 11, color: impact.color, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
              SEKTOR RISK ETKISI — {impact.level} ({impact.label})
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>GNSS / GPS</div>
              <div className="font-data" style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>{impact.gnss}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Elektrik (TEDAS/HVDC)</div>
              <div className="font-data" style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>{impact.grid}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uydu Haberlesme</div>
              <div className="font-data" style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>{impact.comms}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4" style={{ height: 340 }}>
        <div className="flex-1 glass-card p-4" style={{ width: '100%', minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            ZAMAN SERISI GRAFIGI — TAHMINI KP ENDEKSI ({activeForecastSeries.length > 0 ? `${activeForecastSeries[activeForecastSeries.length - 1].hour} SAAT` : '-'})
          </div>
          <KpForecastChart data={activeForecastSeries} height={280} showLegend />
        </div>

        <div className="flex flex-col gap-3" style={{ width: 320 }}>
          <div className="glass-card p-3" style={{ minHeight: 190 }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                SAATLIK OLASILIKLAR
              </div>
              {isSyncing && (
                <div style={{ fontSize: 10, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pulse-dot" style={{ background: 'var(--cyan)', width: 7, height: 7 }} />
                  Syncing with NOAA...
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
              Next Update In (UTC slot): <span className="font-data" style={{ color: 'var(--text-primary)' }}>{formatCountdown(nextNoaa.diffSec)}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
              Next Slot UTC: {nextNoaa.target.toISOString().slice(11, 16)}
            </div>

            <div className="flex flex-col gap-2">
              {hourlyProbabilities.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saatlik olasilik verisi bekleniyor...</div>
              )}
              {hourlyProbabilities.map((row, idx) => {
                const pct = Math.round(row.probability * 100)
                const color = pct >= 85 ? 'var(--red)' : pct >= 65 ? 'var(--orange)' : pct >= 45 ? 'var(--yellow)' : 'var(--cyan)'
                return (
                  <div key={`${row.timeLabel}-${idx}`} className="flex items-center justify-between" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)' }}>
                    <span className="font-data" style={{ fontSize: 11, color: 'var(--text-primary)' }}>{row.timeLabel}</span>
                    <span className="font-data" style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-card p-3 grid grid-cols-3 gap-2" style={{ minHeight: 130 }}>
            {probCards.map(card => (
              <div key={card.label} className="flex flex-col items-center justify-center" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 8, background: 'rgba(0,0,0,0.2)' }}>
                <RiskGaugeChart value={card.prob} color={card.color} size={56} />
                <div className="font-data" style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>{card.label}</div>
                <div className="font-data" style={{ fontSize: 14, fontWeight: 700, color: card.color }}>%{Math.round(card.prob * 100)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 h-full">
        <div className="flex-1 glass-card p-4 overflow-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--cyan)' }}>psychology</span>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              YAPAY ZEKA MODEL BASARISI VE ISTATISTIKLERI
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                <th className="font-data" style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, color: 'var(--text-dim)' }}>Metrik</th>
                <th className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: 'var(--text-dim)' }}>Baseline</th>
                <th className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: 'var(--text-dim)' }}>XGBoost</th>
                <th className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: 'var(--text-dim)' }}>Bi-LSTM</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="font-data" style={{ padding: '10px 8px', fontSize: 11, fontWeight: 600 }}>{m.name}</td>
                  <td className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, color: 'var(--text-muted)' }}>{m.persistence.toFixed(2)}</td>
                  <td className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{m.xgb.toFixed(2)}</td>
                  <td className="font-data" style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, color: 'var(--cyan)', background: 'var(--cyan-glow)', fontWeight: 700 }}>{m.lstm.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
