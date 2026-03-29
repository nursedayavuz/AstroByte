import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../contexts/SettingsContext'
import { createTranslator } from '../utils/translations'

const TYPE_STYLES = {
  STORM: { color: 'var(--red)', icon: 'storm', label: 'Fırtına Uyarısı' },
  CME: { color: 'var(--orange)', icon: 'cloud', label: 'CME Yaklaşımı' },
  SATELLITE: { color: 'var(--cyan)', icon: 'satellite_alt', label: 'Uydu Riski' },
  SYSTEM: { color: 'var(--amber)', icon: 'memory', label: 'Sistem Durumu' }
}

const SEVERITY_MAP = {
  critical: { color: 'var(--red)', label: 'KRİTİK', icon: 'warning' },
  warning: { color: 'var(--amber)', label: 'UYARI', icon: 'error' },
  info: { color: 'var(--cyan)', label: 'BİLGİ', icon: 'info' },
}

export default function NotificationsPage({ notifications = [] }) {
  const { settings } = useSettings()
  const t = createTranslator(settings.language)
  const [selected, setSelected] = useState(notifications.length > 0 ? notifications[0] : null)

  return (
    <motion.div
      className="flex h-full p-4 gap-4 overflow-hidden"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: settings.animations ? 0.3 : 0 }}
    >
      {/* Left: Notification List */}
      <div className="flex flex-col gap-2 overflow-auto" style={{ width: 400 }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
          {t('Bildirimler', 'Notifications')} ({notifications.length})
        </div>
        {notifications.map(notif => {
          const typeStyle = TYPE_STYLES[notif.type] || TYPE_STYLES.SYSTEM
          const sev = SEVERITY_MAP[notif.severity] || SEVERITY_MAP.info
          const isSelected = selected?.id === notif.id
          
          return (
            <div
              key={notif.id}
              onClick={() => setSelected(notif)}
              className="glass-card p-4"
              style={{
                borderLeft: `4px solid ${typeStyle.color}`,
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
                transition: 'background 0.2s'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: typeStyle.color }}>{typeStyle.icon}</span>
                  <span className="font-data" style={{ fontSize: 10, color: typeStyle.color, fontWeight: 700, textTransform: 'uppercase' }}>
                    {t(typeStyle.label)}
                  </span>
                </div>
                <span className="font-data" style={{ padding: '2px 4px', background: `${sev.color}22`, color: sev.color, fontSize: 8, borderRadius: 4, fontWeight: 700 }}>
                  {t(sev.label)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 4, fontWeight: 500 }}>{notif.title}</div>
              <div className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{notif.time}</div>
            </div>
          )
        })}
      </div>

      {/* Right: Notification Detail */}
      <div className="flex-1 flex flex-col gap-4 overflow-auto">
        {/* Preview */}
        <div className="glass-card p-6 flex-1 overflow-auto relative">
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
            {t('BİLDİRİM ÖNİZLEME', 'NOTIFICATION PREVIEW')}
          </div>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: (TYPE_STYLES[selected.type] || TYPE_STYLES.SYSTEM).color }}>
                    {(TYPE_STYLES[selected.type] || TYPE_STYLES.SYSTEM).icon}
                  </span>
                  <div>
                    <h2 style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>{selected.title}</h2>
                    <div className="font-data mt-1" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selected.time} | KANAL: {selected.channel}</div>
                  </div>
                </div>
                
                <pre className="font-code" style={{
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(0,0,0,0.3)',
                  padding: 24,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                }}>
                  {selected.content || 'Bildirim içeriği bulunamadı.'}
                </pre>
                
                <div className="mt-4 flex gap-3">
                  <button className="font-data" style={{ padding: '8px 16px', background: 'var(--cyan)', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                    HIZLI AKSİYON AL
                  </button>
                  <button className="font-data" style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                    CİHAZLARA YAYINLA
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, color: 'var(--cyan)' }}>sensors</span>
                <p className="font-code" style={{ fontSize: 12, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  {t('Bildirim sistemi aktif — veri bekleniyor', 'Notification system active — awaiting data')}
                </p>
                <p style={{ fontSize: 10, opacity: 0.6, marginTop: 8 }}>TUA Erken Uyarı Ağı devrede.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
