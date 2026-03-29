import React, { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

const defaultSettings = {
  backendEnabled: true,
  apiKey: 'DEMO_KEY',
  refreshInterval: 60,
  backendUrl: 'http://localhost:8000',
  kpGreenYellow: 4,
  kpYellowOrange: 6,
  kpOrangeRed: 7,
  flareThreshold: 'M',
  probThreshold: 60,
  emailEnabled: false,
  emailAddress: '',
  smsEnabled: false,
  smsPhone: '',
  webhookEnabled: false,
  webhookUrl: '',
  language: 'TR',
  globeQuality: 'Orta',
  animations: true,
  scanlines: true,
}

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem('solarguard_settings')
      const parsed = saved ? JSON.parse(saved) : {}
      // Force backendEnabled to always be true
      return { ...defaultSettings, ...parsed, backendEnabled: true }
    } catch {
      return defaultSettings
    }
  })

  // Whenever settings change, save to localStorage
  useEffect(() => {
    localStorage.setItem('solarguard_settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => {
    setSettingsState(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
