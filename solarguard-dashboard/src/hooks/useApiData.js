import { useState, useEffect, useMemo, useRef } from 'react'

const API_BASE = '/api'

function sampleData(arr, maxPoints = 72) {
  if (!arr || arr.length <= maxPoints) return arr
  const step = Math.ceil(arr.length / maxPoints)
  return arr.filter((_, i) => i % step === 0 || i === arr.length - 1)
}

export function useApiData(backendEnabled = true) {
  const [data, setData] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const failCount = useRef(0)
  // Track the current backendEnabled value so async callbacks can check it
  const backendEnabledRef = useRef(backendEnabled)

  // Keep ref in sync
  useEffect(() => {
    backendEnabledRef.current = backendEnabled
  }, [backendEnabled])

  async function fetchAll() {
    // Pre-flight check
    if (!backendEnabledRef.current) {
      setData(null)
      setIsLive(false)
      failCount.current = 0
      return
    }
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE}/turkish-asset-risk`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/forecast-series`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/space-weather-history`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/model-metrics`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/recent-flares`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/geomagnetic-storms`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/donki-notifications`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/interplanetary-shocks`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/wsa-enlil`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/radiation-belt-enhancement`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/latest-flare`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/goes-xray`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/telemetry-summary`).then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      // ★ POST-FLIGHT CHECK: If backend was disabled while we were fetching, discard results
      if (!backendEnabledRef.current) {
        setData(null)
        setIsLive(false)
        return
      }
      
      const [risk, forecast, history, metrics, flares, storms, notifications, shocks, wsaEnlil, rbe, latestFlare, goesXray, telemetrySummary] = responses
      
      // If ANY core data exists, consider it a successful fetch.
      // Previously, minor API timeouts caused the entire dashboard to go blank.
      const hasCoreData = risk || history || metrics;

      if (hasCoreData) {
        // Merge the current valid data with any previous data to avoid flickering on transient nulls
        setData(prev => ({
           risk: risk || prev?.risk,
           forecast: forecast || prev?.forecast,
           history: history || prev?.history,
           metrics: metrics || prev?.metrics,
           flares: flares || prev?.flares,
           storms: storms || prev?.storms,
           notifications: notifications || prev?.notifications,
           shocks: shocks || prev?.shocks,
           wsaEnlil: wsaEnlil || prev?.wsaEnlil,
           rbe: rbe || prev?.rbe,
           latestFlare: latestFlare || prev?.latestFlare,
           goesXray: goesXray || prev?.goesXray,
           telemetrySummary: telemetrySummary || prev?.telemetrySummary
        }))
        setIsLive(true)
        setLastUpdate(new Date())
        failCount.current = 0
      } else {
        // Track consecutive failures and set offline after 3 attempts
        failCount.current += 1
        if (failCount.current >= 3) {
          setIsLive(false)
        }
      }
    } catch {
      // Track consecutive failures and set offline after 3 attempts
      failCount.current += 1
      if (failCount.current >= 3) {
        setIsLive(false)
      }
    }
  }

  useEffect(() => {
    // When backend is disabled, immediately clear data and stop
    if (!backendEnabled) {
      setData(null)
      setIsLive(false)
      failCount.current = 0
      return // No interval, no fetch
    }

    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [backendEnabled])

  function mergeSatellites(apiRisks) {
    if (!apiRisks || typeof apiRisks !== 'object') return []
    return Object.entries(apiRisks).map(([name, info]) => {
      return {
        id: name.replace(/[\s-]/g, '_').toLowerCase(),
        name: name,
        orbit: info.orbit_type || 'LEO',
        alt_km: info.altitude_km || 500,
        lon: null,
        inc: 0,
        risk: info.risk_score ?? 0,
        level: info.alert_level || 'GREEN',
        risk_type: info.risk_type || 'unknown',
        operator: 'Bilinmiyor',
        services: info.services_affected || [],
        criticality: 0.5,
      }
    })
  }

  function mergeGroundAssets(apiRisks) {
    if (!apiRisks || typeof apiRisks !== 'object') return []
    return Object.entries(apiRisks).map(([name, info]) => {
      return {
        id: name.replace(/[\s-]/g, '_').toLowerCase(),
        name: name.replace(/_/g, ' '),
        lat: info.lat ?? 39.0,
        lon: info.lon ?? 32.0,
        risk: info.risk_score ?? 0,
        level: info.alert_level || 'GREEN',
        type: info.type || 'power_grid',
        criticality: 0.5,
      }
    })
  }

  function normalizeForecast(apiForecast) {
    if (!apiForecast || !Array.isArray(apiForecast)) return []
    return apiForecast.map((p, i) => ({
      hour: p.hour ?? i,
      kp_lstm: p.kp_lstm ?? p.kp_lower_ci ?? 0,
      kp_xgb: p.kp_xgb ?? p.kp_lstm ?? 0,
      kp_baseline: p.kp_baseline ?? 0,
      kp_lower_ci: p.kp_lower_ci ?? p.kp_lower ?? 0,
      kp_upper_ci: p.kp_upper_ci ?? p.upper ?? 0,
    }))
  }

  const satellites = useMemo(
    () => data?.risk?.satellite_risks ? mergeSatellites(data.risk.satellite_risks) : [],
    [data?.risk?.satellite_risks]
  )

  const groundAssets = useMemo(
    () => data?.risk?.ground_risks ? mergeGroundAssets(data.risk.ground_risks) : [],
    [data?.risk?.ground_risks]
  )

  const forecastSeries = useMemo(
    () => sampleData(data?.forecast ? normalizeForecast(data.forecast) : []),
    [data?.forecast]
  )

  const recentFlares = (Array.isArray(data?.flares) && data.flares.length > 0)
    ? data.flares
    : []

  const { maxClass, highestFlare } = useMemo(() => {
    let mClass = 'A'
    let hFlare = '-'
    for (const f of recentFlares) {
      const c = f.classType || ''
      if (!c) continue
      if (c.startsWith('X')) mClass = 'X'
      if (mClass !== 'X' && c.startsWith('M')) mClass = 'M'
      if (mClass !== 'X' && mClass !== 'M' && c.startsWith('C')) mClass = 'C'
      if (mClass !== 'X' && mClass !== 'M' && mClass !== 'C' && c.startsWith('B')) mClass = 'B'

      if (c > hFlare) hFlare = c
    }
    return { maxClass: mClass, highestFlare: hFlare }
  }, [recentFlares])

  // ★ FIX: All alert values are null when data is unavailable — no hardcoded defaults
  // ★ FIX: prob_mx_24h now uses the actual M+ event probability from risk API
  //         (was incorrectly using lstm.precision_24h which is a model accuracy metric ≈ 1.0)
  const calculatedAlertState = useMemo(() => ({
    kp_current: (() => {
      // Önce telemetry-summary'den Kp'yi al
      if (data?.telemetrySummary?.kp_index != null) {
        return data.telemetrySummary.kp_index
      }
      // Sonra realtime telemetri'den son Kp'yi al
      const events = data?.history?.highlight_events
      if (events?.length > 0) {
        return events[events.length - 1]?.kp_subsequent ?? null
      }
      // Kp≥4 olay yoksa forecastSeries'in ilk noktasını kullan
      const firstForecast = data?.forecast?.[0]
      if (firstForecast?.kp_lstm != null) return firstForecast.kp_lstm
      return null
    })(),
    current_flare: data?.goesXray?.flare_class || data?.latestFlare?.flare_class || (data ? highestFlare : null),
    solar_wind: data?.telemetrySummary?.wind_speed ?? data?.history?.realtime_telemetry?.solar_wind_speed ?? null,
    bz_gsm: data?.telemetrySummary?.imf_bz ?? data?.history?.realtime_telemetry?.bz_gsm ?? null,
    density: data?.telemetrySummary?.density ?? data?.history?.realtime_telemetry?.proton_density ?? null,
    proton_flux: data?.telemetrySummary?.proton_flux ?? null,
    prob_mx_24h: data?.risk?.prob_mx_event ?? null,
  }), [highestFlare, data?.risk, data?.history, data?.forecast, data?.latestFlare, data?.telemetrySummary])

  const compositeAlertLevel = maxClass === 'X' ? 'RED' : maxClass === 'M' ? 'ORANGE' : 'GREEN'

  return {
    isLive,
    lastUpdate,
    alertState: calculatedAlertState,
    satellites,
    groundAssets,
    forecastSeries,
    modelMetrics: data?.metrics || null,
    recentFlares,
    eventLog: data?.history?.highlight_events ? data.history.highlight_events.map((ev, i) => ({
      id: i,
      time: ev.date,
      type: String(ev.class).includes('G') ? 'Storm' : 'Flare',
      severity: ev.class,
      description: ev.description,
    })) : [],
    systemLogs: data?.history?.highlight_events ? data.history.highlight_events.map((ev, i) => ({
      id: `sys-${i}`,
      time: ev.date,
      level: String(ev.class).includes('G') ? 'CRITICAL' : 'WARNING',
      process: 'NOAA_SYNC',
      message: ev.description,
    })) : [],
    // New DONKI Data Exposed to the Application
    geomagneticStorms: data?.storms || [],
    donkiNotifications: data?.notifications || [],
    shocks: data?.shocks || [],
    wsaEnlil: data?.wsaEnlil || [],
    radiationBelts: data?.rbe || [],
    compositeAlertLevel,
  }
}
