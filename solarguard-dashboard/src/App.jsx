import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import { useApiData } from './hooks/useApiData'
import DashboardPage from './pages/DashboardPage'
import SolarFlaresPage from './pages/SolarFlaresPage'
import SatelliteRiskPage from './pages/SatelliteRiskPage'
import PredictionsPage from './pages/PredictionsPage'
import TelemetryPage from './pages/TelemetryPage'
import RiskAnalysisPage from './pages/RiskAnalysisPage'

import SystemLogsPage from './pages/SystemLogsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'

function AppContent() {
  const { settings } = useSettings()
  const data = useApiData(settings.backendEnabled)

  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden relative">
        {settings.scanlines && (
          <div 
            className="scanlines-overlay" 
            style={{ 
              position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none',
              background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
              backgroundSize: '100% 4px, 6px 100%'
            }} 
          />
        )}
        {/* Skip-to-content link for keyboard users */}
        <a
          href="#main-content"
          className="skip-link"
          style={{
            position: 'absolute',
            top: -50,
            left: 0,
            background: 'var(--cyan)',
            color: '#000',
            padding: '8px 16px',
            zIndex: 100,
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
            transition: 'top 0.2s',
          }}
          onFocus={e => e.currentTarget.style.top = '0px'}
          onBlur={e => e.currentTarget.style.top = '-50px'}
        >
          Ana içeriğe geç
        </a>

        <div className="star-field" aria-hidden="true" />
        <TopBar alertLevel={data.compositeAlertLevel} isLive={data.isLive} lastUpdate={data.lastUpdate} />
        <Sidebar alertState={data.alertState} />
        <main
          id="main-content"
          role="main"
          aria-label="SolarGuard-TR Dashboard ana içerik alanı"
          className="app-main overflow-hidden relative"
          style={{
            marginLeft: 260,
            marginTop: 60,
            height: 'calc(100vh - 60px)',
          }}
        >
          <Routes>
            <Route path="/" element={
              <DashboardPage
                satellites={data.satellites}
                groundAssets={data.groundAssets}
                alertState={data.alertState}
                forecastSeries={data.forecastSeries}
                eventLog={data.eventLog}
              />
            } />
            <Route path="/solar-flares" element={
              <SolarFlaresPage recentFlares={data.recentFlares} alertState={data.alertState} />
            } />
            <Route path="/satellite-risk" element={
              <SatelliteRiskPage satellites={data.satellites} />
            } />
            <Route path="/predictions" element={
              <PredictionsPage
                forecastSeries={data.forecastSeries}
                alertState={data.alertState}
                modelMetrics={data.modelMetrics}
                wsaEnlil={data.wsaEnlil}
                storms={data.geomagneticStorms}
              />
            } />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/risk-analysis" element={
              <RiskAnalysisPage groundAssets={data.groundAssets} />
            } />

            <Route path="/system-logs" element={
              <SystemLogsPage systemLogs={data.systemLogs} />
            } />
            <Route path="/notifications" element={
              <NotificationsPage notifications={data.notifications} />
            } />
            <Route path="/settings" element={<SettingsPage isLive={data.isLive} />} />
          </Routes>
        </main>
        </div>
      </BrowserRouter>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}
