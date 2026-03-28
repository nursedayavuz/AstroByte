import { useSettings } from '../../contexts/SettingsContext'
import { createTranslator } from '../../utils/translations'

export default function GlobeControls({ toggles, onToggle, swarmFilter = 'ALL', onSwarmFilterChange, timeMultiplier = 1, onTimeMultiplierChange }) {
  const { settings } = useSettings()
  const t = createTranslator(settings.language)

  const buttons = [
    { key: 'aurora', icon: 'auto_awesome', label: t('Aurora', 'Aurora') },
    { key: 'heatmap', icon: 'public', label: t('Etki Alanı', 'Impact Zone') },
    { key: 'cme', icon: 'storm', label: t('CME Şoku', 'CME Shock') },
  ]

  const swarmFilters = [
    { key: 'ALL', label: t('Tümü', 'All') },
    { key: 'TURKEY', label: t('Türk Uyduları', 'Turkish Sats') },
    { key: 'STARLINK', label: t('Starlink', 'Starlink') },
    { key: 'GPS', label: t('Navigasyon', 'Navigation') },
  ]

  const handleZoom = (direction) => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.dispatchEvent(new WheelEvent('wheel', {
        deltaY: direction === 'in' ? -500 : 500,
        bubbles: true,
      }))
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 glass-strong" style={{ borderRadius: 8, pointerEvents: 'auto' }} role="toolbar" aria-label="Küre kontrolleri">
      <div className="flex gap-2 justify-center">
      {buttons.map(btn => {
        const active = toggles[btn.key]
        return (
          <button
            key={btn.key}
            onClick={() => onToggle(btn.key)}
            aria-pressed={active}
            aria-label={`${btn.label} ${active ? 'açık' : 'kapalı'}`}
            title={active ? t('Kapat', 'Turn Off') : t('Veri Bekleniyor (Simüle Ediliyor)', 'Awaiting Data (Simulating)')}
            className="flex items-center gap-1 glass-card py-2 px-3"
            style={{
              background: active ? 'var(--cyan-glow)' : 'var(--bg-card)',
              borderColor: active ? 'var(--cyan)' : 'var(--border-subtle)',
              color: active ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              border: `1px solid ${active ? 'var(--cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">{btn.icon}</span>
            {btn.label}
          </button>
        )
      })}
      <button
        onClick={() => onToggle('reset')}
        aria-label="Küre kontrollerini sıfırla"
        className="flex items-center gap-1 py-1 px-3"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 9,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">restart_alt</span>
      </button>
      </div>
      
      


      {/* UI Panels specifically regarding filtering have been removed as the dashboard now monitors a unified fleet */}
    </div>
  )
}
