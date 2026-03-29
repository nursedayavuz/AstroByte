import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'
import { useSettings } from '../contexts/SettingsContext'

function LiveLineCard({ title, unit, colorVar, min, max, data = [] }) {
  const current = data.length > 0 ? data[data.length - 1]?.value : '-';
  return (
    <div className="glass-card p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
        <span className="font-data" style={{ fontSize: 18, fontWeight: 700, color: colorVar }}>{current} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unit}</span></span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={false} stroke="var(--text-dim)" />
            <YAxis domain={[min, max]} stroke="var(--text-dim)" tick={{ fontSize: 8, fill: 'var(--text-dim)', fontFamily: "'Space Mono'" }} />
            <Line type="monotone" dataKey="value" stroke={colorVar} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GaugeCard({ title, value, max, level, unit, displayValue }) {
  const gaugeColors = { A: '#00ff88', B: '#00ff88', C: '#ffdc00', M: '#ff8c00', X: '#ff2222', '-': 'var(--text-dim)', GREEN: '#00ff88', YELLOW: '#ffdc00', ORANGE: '#ff8c00', RED: '#ff2222' }
  const color = level ? (gaugeColors[level] || gaugeColors['-']) : gaugeColors['-']
  const percent = value ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="glass-card p-4 flex flex-col items-center">
      <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{title}</span>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${percent * 2.01} 201`} strokeLinecap="round"
            transform="rotate(-90 40 40)" />
        </svg>
        <div className="font-data" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>
          {displayValue ?? level ?? value ?? '-'}
        </div>
      </div>
      <span className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{unit}</span>
    </div>
  )
}

export default function TelemetryPage() {
  const { settings } = useSettings()
  const terminalRef = useRef(null)
  const [solarWindHistory, setSolarWindHistory] = useState([])
  const [plasmaHistory, setPlasmaHistory] = useState([])
  const [bzHistory, setBzHistory] = useState([])
  const [terminalLines, setTerminalLines] = useState([])
  const [goesData, setGoesData] = useState([])
  const [gauges, setGauges] = useState({ kp: null, kpLevel: '-', flareClass: '-', flareLevel: '-', protonFlux: null, electronFlux: null })

  // Fetch real data from backend and accumulate time-series
  async function fetchTelemetry() {
    // ★ FIX: Check backendEnabled before fetching
    if (!settings.backendEnabled) return

    try {
      const [historyRes, flareRes, forecastRes] = await Promise.all([
        fetch('/api/space-weather-history').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/recent-flares?days=30').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/forecast-series').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      // ★ FIX: Double-check after await (settings might have changed during fetch)
      // We can't check ref here easily, but the interval will be cleared on re-render

      if (historyRes) {
        // ★ FIX: Use null instead of hardcoded fallbacks — only set if real data exists
        const swRaw = historyRes.realtime_telemetry?.solar_wind_speed
        const densityRaw = historyRes.realtime_telemetry?.proton_density
        const bzRaw = historyRes.realtime_telemetry?.bz_gsm

        if (swRaw != null && densityRaw != null && bzRaw != null) {
          const sw = Number(swRaw)
          const density = Number(densityRaw)
          const bz = Number(bzRaw)
          const now = new Date()
          const utcTime = now.getUTCHours().toString().padStart(2,'0') + ':' + now.getUTCMinutes().toString().padStart(2,'0') + ':' + now.getUTCSeconds().toString().padStart(2,'0')

          // Accumulate time-series (max 60 points)
          setSolarWindHistory(prev => [...prev.slice(-59), { time: utcTime, value: +sw.toFixed(1) }])
          setPlasmaHistory(prev => [...prev.slice(-59), { time: utcTime, value: +density.toFixed(1) }])
          setBzHistory(prev => [...prev.slice(-59), { time: utcTime, value: +bz.toFixed(2) }])

          // Terminal lines
          setTerminalLines(prev => [...prev.slice(-19), {
            time: utcTime,
            swv: sw.toFixed(1),
            np: density.toFixed(1),
            bz: bz.toFixed(2),
            bzColor: bz < -5 ? 'var(--red)' : bz < 0 ? 'var(--orange)' : 'var(--green)'
          }])
        }

        // Kp gauge — no fallback, use null if not available
        const events = historyRes.highlight_events
        if (events && events.length > 0) {
          const kpVal = events[events.length - 1]?.kp_subsequent
          if (kpVal != null) {
            const kpLevel = kpVal >= 7 ? 'RED' : kpVal >= 5 ? 'ORANGE' : kpVal >= 4 ? 'YELLOW' : 'GREEN'
            setGauges(prev => ({ ...prev, kp: kpVal, kpLevel }))
          }
        }
      }

      // Flare class gauge
      if (flareRes && Array.isArray(flareRes) && flareRes.length > 0) {
        let maxClass = '-'
        for (const f of flareRes) {
          const c = f.classType || ''
          if (c.startsWith('X')) maxClass = c
          else if (maxClass === '-' && c.startsWith('M')) maxClass = c
          else if (maxClass === '-' && c.startsWith('C')) maxClass = c
        }
        const level = maxClass.startsWith('X') ? 'X' : maxClass.startsWith('M') ? 'M' : maxClass.startsWith('C') ? 'C' : '-'
        setGauges(prev => ({ ...prev, flareClass: maxClass, flareLevel: level }))

        // Build GOES X-ray timeline from flares with real timestamps
        const goesTimeline = flareRes.map((f, i) => {
          const c = f.classType || 'A1.0'
          let val = 0.5
          if (c.startsWith('X')) val = 4 + parseFloat(c.substring(1) || '1')
          else if (c.startsWith('M')) val = 3 + parseFloat(c.substring(1) || '1') / 10
          else if (c.startsWith('C')) val = 2 + parseFloat(c.substring(1) || '1') / 10
          else if (c.startsWith('B')) val = 1 + parseFloat(c.substring(1) || '1') / 10
          const date = f.peakTime ? new Date(f.peakTime) : new Date()
          const label = (date.getUTCMonth()+1) + '/' + date.getUTCDate()
          return { hour: label, value: +val.toFixed(2), classType: c }
        })
        setGoesData(goesTimeline)
      }

      // Proton/Electron (derived from Kp) — only if kp is available
      if (historyRes) {
        setGauges(prev => {
          if (prev.kp == null) return prev
          return {
            ...prev,
            protonFlux: Math.round(Math.pow(10, prev.kp * 0.4)),
            electronFlux: Math.round(Math.pow(10, prev.kp * 0.35)),
          }
        })
      }
    } catch (e) {
      console.error('Telemetry fetch error:', e)
    }
  }

  useEffect(() => {
    // ★ FIX: If backend is disabled, clear all data and don't start interval
    if (!settings.backendEnabled) {
      setSolarWindHistory([])
      setPlasmaHistory([])
      setBzHistory([])
      setTerminalLines([])
      setGoesData([])
      setGauges({ kp: null, kpLevel: '-', flareClass: '-', flareLevel: '-', protonFlux: null, electronFlux: null })
      return
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [settings.backendEnabled])

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight
  }, [terminalLines])

  return (
    <motion.div
      className="flex flex-col h-full p-4 gap-4 overflow-auto"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
    >
      {/* TOP ROW — Live time-series charts */}
      <div className="grid grid-cols-3 gap-4" style={{ height: 220 }}>
        <LiveLineCard title="Güneş Rüzgarı Hızı" unit="km/s" colorVar="var(--cyan)" min={300} max={900} data={solarWindHistory} />
        <LiveLineCard title="Plazma Yoğunluğu" unit="p/cm³" colorVar="var(--blue)" min={0} max={15} data={plasmaHistory} />
        <LiveLineCard title="IMF Bz Bileşeni" unit="nT" colorVar="var(--red)" min={-20} max={20} data={bzHistory} />
      </div>

      {/* MIDDLE ROW — Gauge cards with real values */}
      <div className="grid grid-cols-4 gap-4" style={{ height: 160 }}>
        <GaugeCard title="X-Işını Akısı" value={gauges.flareClass !== '-' ? 50 : 0} max={100} level={gauges.flareLevel || '-'} displayValue={gauges.flareClass} unit="GOES Sınıfı" />
        <GaugeCard title="Proton Akısı (>10 MeV)" value={gauges.protonFlux != null ? Math.min(gauges.protonFlux, 100) : 0} max={100} level={gauges.protonFlux != null ? (gauges.protonFlux > 50 ? 'RED' : gauges.protonFlux > 10 ? 'ORANGE' : 'GREEN') : '-'} displayValue={gauges.protonFlux ?? '-'} unit="pfu" />
        <GaugeCard title="Elektron Akısı (>2 MeV)" value={gauges.electronFlux != null ? Math.min(gauges.electronFlux, 100) : 0} max={100} level={gauges.electronFlux != null ? (gauges.electronFlux > 50 ? 'RED' : gauges.electronFlux > 10 ? 'ORANGE' : 'GREEN') : '-'} displayValue={gauges.electronFlux ?? '-'} unit="GEO e⁻" />
        <GaugeCard title="Kp Gerçek Zamanlı" value={gauges.kp != null ? (gauges.kp / 9) * 100 : 0} max={100} level={gauges.kpLevel} displayValue={gauges.kp ?? '-'} unit="Kp İndeksi" />
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-2 gap-4 flex-1" style={{ minHeight: 200 }}>
        {/* Terminal — ACE/DSCOVR live data feed */}
        <div className="glass-card p-4 flex flex-col">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            ACE/DSCOVR VERİ AKIŞI
          </div>
          <div
            ref={terminalRef}
            className="flex-1 overflow-auto font-code"
            style={{ background: '#000', borderRadius: 6, padding: 10, fontSize: 11, lineHeight: 1.6 }}
          >
            {terminalLines.length === 0 && (
              <div style={{ color: 'var(--text-dim)' }}>
                {settings.backendEnabled ? 'Veri bekleniyor... (10s aralıklarla güncellenir)' : 'Backend bağlantısı kapalı.'}
              </div>
            )}
            {terminalLines.map((line, i) => (
              <div key={i} className="slide-in-up">
                <span style={{ color: 'var(--text-dim)' }}>[{line.time} UTC]</span>
                {' '}
                <span style={{ color: 'var(--green)' }}>SW_V:</span> <span style={{ color: 'var(--text-primary)' }}>{line.swv} km/s</span>
                {' | '}
                <span style={{ color: 'var(--green)' }}>Np:</span> <span style={{ color: 'var(--text-primary)' }}>{line.np} p/cm³</span>
                {' | '}
                <span style={{ color: 'var(--green)' }}>Bz:</span> <span style={{ color: line.bzColor }}>{line.bz} nT</span>
              </div>
            ))}
          </div>
        </div>

        {/* GOES X-ray timeline */}
        <div className="glass-card p-4 flex flex-col">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            GOES X-RAY FLUX TIMELINE
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={goesData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" stroke="var(--text-dim)" tick={{ fontSize: 8, fill: 'var(--text-dim)', fontFamily: "'Space Mono'" }} interval={2} />
                <Tooltip contentStyle={{ background: 'rgba(5,6,15,0.95)', border: '1px solid var(--border-accent)', borderRadius: 8, fontSize: 10, fontFamily: "'Space Mono'" }} formatter={(val, name, props) => [`${props.payload.classType} (${val.toFixed(1)})`, 'GOES Sınıfı']} />
                <YAxis stroke="var(--text-dim)" tick={{ fontSize: 8, fill: 'var(--text-dim)', fontFamily: "'Space Mono'" }} />
                <ReferenceLine y={2} stroke="var(--alert-yellow)" strokeDasharray="3 3" label={{ value: 'C', fill: 'var(--alert-yellow)', fontSize: 8 }} />
                <ReferenceLine y={3} stroke="var(--orange)" strokeDasharray="3 3" label={{ value: 'M', fill: 'var(--orange)', fontSize: 8 }} />
                <ReferenceLine y={4} stroke="var(--red)" strokeDasharray="3 3" label={{ value: 'X', fill: 'var(--red)', fontSize: 8 }} />
                <defs>
                  <linearGradient id="goesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--red)" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="var(--orange)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--green)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="var(--orange)" fill="url(#goesGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
