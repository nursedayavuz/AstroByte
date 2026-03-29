import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../utils/constants'
import MetricCard from '../cards/MetricCard'
import { useSettings } from '../../contexts/SettingsContext'
import { createTranslator } from '../../utils/translations'

export default function Sidebar({ alertState }) {
  const [collapsed, setCollapsed] = useState(false)
  const { settings } = useSettings()

  const t = createTranslator(settings.language)

  return (
    <>
      {/* Mobile hamburger button — visible only on small screens */}
      <button
        className="sidebar-hamburger"
        onClick={() => setCollapsed(prev => !prev)}
        aria-label={collapsed ? 'Menüyü aç' : 'Menüyü kapat'}
        aria-expanded={!collapsed}
        style={{
          position: 'fixed',
          top: 14,
          left: 12,
          zIndex: 60,
          width: 36,
          height: 36,
          background: 'rgba(5,6,15,0.9)',
          border: '1px solid var(--border-accent)',
          borderRadius: 8,
          color: 'var(--cyan)',
          cursor: 'pointer',
          display: 'none', /* shown via CSS media query */
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {collapsed ? 'menu' : 'close'}
        </span>
      </button>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="sidebar-overlay"
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 39,
            background: 'rgba(0,0,0,0.5)',
            display: 'none', /* shown via CSS media query */
          }}
        />
      )}

      <aside
        className={`sidebar-container ${collapsed ? 'sidebar-collapsed' : ''}`}
        role="navigation"
        aria-label="Ana menü"
        style={{
          position: 'fixed',
          left: 0,
          width: 260,
          top: 60,
          bottom: 0,
          zIndex: 40,
          background: 'rgba(5, 6, 15, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Operator Badge */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 40, height: 40, border: '1px solid var(--border-accent)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--cyan)' }}>shield</span>
            </div>
            <div>
              <div className="font-data" style={{ fontSize: 10, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {t('OPERATÖR', 'OPERATOR')}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                SolarGuard Mission Control
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3" aria-label="Sayfa navigasyonu">
          <div className="font-data px-5 mb-2" style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            {t('ANA MODÜLLER', 'MAIN MODULES')}
          </div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.route}
              to={item.route}
              end={item.route === '/'}
              className={({ isActive }) => `flex items-center gap-3 py-2.5 px-5 no-underline transition-colors`}
              style={({ isActive }) => ({
                color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                background: isActive ? 'var(--cyan-glow)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                textDecoration: 'none',
              })}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
              onClick={() => {
                if (window.innerWidth < 1024) setCollapsed(true)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              <span className="font-data" style={{ fontSize: 11, textTransform: 'uppercase' }}>{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Quick Stats — Pushed completely into the bottom edge space */}
        <div className="px-4 pb-0 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="grid grid-cols-2 gap-2" style={{ transform: 'translateY(10px)', paddingBottom: 16 }}>
            <MetricCard label={t('Kp İndeksi', 'Kp Index')} value={alertState?.kp_current ?? '-'} color="var(--amber)" />
            <MetricCard label={t('Patlama', 'Flare')} value={alertState?.current_flare ?? '-'} color="var(--red)" />
            <MetricCard label={t('M+ Olasılık', 'M+ Prob.')} value={alertState?.prob_mx_24h != null ? `%${Math.round(alertState.prob_mx_24h * 100)}` : '-'} color="var(--cyan)" />
            <MetricCard label={t('CME Hız', 'CME Speed')} value={alertState?.cme_speed ?? '-'} suffix="km/s" />
          </div>
        </div>
      </aside>
    </>
  )
}
