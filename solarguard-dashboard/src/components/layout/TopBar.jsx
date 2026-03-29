import { useNavigate } from 'react-router-dom'
import { useClock } from '../../hooks/useClock'
import AlertBadge from '../cards/AlertBadge'
import StatusDot from '../shared/StatusDot'
import { useSettings } from '../../contexts/SettingsContext'
import { createTranslator } from '../../utils/translations'

export default function TopBar({ alertLevel = "RED", isLive = false, lastUpdate }) {
  const { utcString } = useClock()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const t = createTranslator(settings.language)
  
  const updateTimeStr = lastUpdate ? lastUpdate.toISOString().slice(11, 19) : utcString

  return (
    <header
      className="topbar-container"
      role="banner"
      aria-label="SolarGuard-TR üst bilgi çubuğu"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 60,
        zIndex: 50,
        background: 'rgba(5, 6, 15, 0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* LEFT — Logo */}
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <div
            className="font-display"
            style={{
              fontSize: 16,
              color: 'var(--cyan)',
              letterSpacing: '0.2em',
              textShadow: '0 0 12px rgba(0,255,240,0.5)',
            }}
          >
            SOLARGUARD-TR
          </div>
          <div className="topbar-subtitle" style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            {t('Güneş Fırtınası Erken Uyarı Sistemi', 'Solar Storm Early Warning System')}
          </div>
        </div>
      </div>

      {/* CENTER — Alert + Update time */}
      <div className="topbar-center" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <AlertBadge level={alertLevel} />
        <span className="font-data topbar-update-text" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          {t('Son Güncelleme:', 'Last Update:')} {updateTimeStr} UTC
        </span>
      </div>

      {/* RIGHT — Status + Clock + Controls */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div className="topbar-donki-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot color={isLive ? 'var(--green)' : 'var(--red)'} size={8} />
          <span className="font-data" style={{ fontSize: 10, color: isLive ? 'var(--green)' : 'var(--red)' }} aria-live="polite">
            {isLive ? t('DONKI + NOAA SDO: AKTİF', 'DONKI + NOAA SDO: ACTIVE') : t('VERİ KAYNAĞI: BAĞLANTI YOK', 'DATA SOURCE: DISCONNECTED')}
          </span>
        </div>

        <div className="topbar-divider" style={{ width: 1, height: 30, background: 'var(--border-subtle)' }} />

        <span className="font-data topbar-clock" style={{ fontSize: 14, color: 'var(--cyan)' }} aria-label={`UTC saat: ${utcString}`}>
          UTC {utcString}
        </span>

        <div className="topbar-divider" style={{ width: 1, height: 30, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            aria-label="Bildirimler"
            onClick={() => navigate('/notifications')}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
          </button>
        </div>
      </div>
    </header>
  )
}
