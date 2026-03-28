import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../contexts/SettingsContext'
import { createTranslator } from '../utils/translations'

function SettingsSection({ title, children }) {
  return (
    <div className="glass-card p-5 mb-4">
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SettingsRow({ label, children, tooltip }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
        {label}
        {tooltip && <span className="material-symbols-outlined ml-2" style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'help', marginLeft: 6 }} title={tooltip}>info</span>}
      </span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: checked ? 'var(--cyan)' : 'rgba(255,255,255,0.15)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function SettingsPage({ isLive }) {
  const { settings, updateSetting } = useSettings()
  const t = createTranslator(settings.language)
  const [healthStatus, setHealthStatus] = useState(null)

  useEffect(() => {
    if (settings.backendEnabled) {
      fetch('/api/health').then(r => r.ok ? r.json() : null)
        .then(d => setHealthStatus(d ? 'OK' : 'ERR'))
        .catch(() => setHealthStatus('ERR'))
    } else {
      setHealthStatus('OFF')
    }
  }, [settings.backendEnabled])

  return (
    <motion.div
      className="h-full p-4 overflow-auto"
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: settings.animations ? 0.3 : 0 }}
      style={{ maxWidth: 800 }}
    >

      {/* Backend Connection */}
      <SettingsSection title={t('Backend Bağlantısı', 'Backend Connection')}>
        <SettingsRow label={t('Backend Aktif', 'Backend Enabled')} tooltip={t('Kapatırsanız tüm API çağrıları durur ve veriler sıfırlanır.', 'When disabled, all API calls stop and data is cleared.')}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: healthStatus === 'OK' ? '#00ff87' : healthStatus === 'OFF' ? 'var(--text-muted)' : '#ff2222',
              boxShadow: healthStatus === 'OK' ? '0 0 8px #00ff87' : 'none',
            }} />
            <span className="font-data" style={{ fontSize: 9, color: healthStatus === 'OK' ? '#00ff87' : healthStatus === 'OFF' ? 'var(--text-muted)' : '#ff2222' }}>
              {healthStatus === 'OK' ? t('BAĞLI', 'CONNECTED') : healthStatus === 'OFF' ? t('KAPALI', 'DISABLED') : t('BAĞLANTI YOK', 'NO CONNECTION')}
            </span>
            <Toggle checked={settings.backendEnabled} onChange={v => updateSetting('backendEnabled', v)} />
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Alert Thresholds */}
      <SettingsSection title={t('Uyarı Eşik Değerleri', 'Alert Thresholds')}>
        {[
          { label: `Kp GREEN→YELLOW (${settings.kpGreenYellow})`, key: 'kpGreenYellow', min: 1, max: 5 },
          { label: `Kp YELLOW→ORANGE (${settings.kpYellowOrange})`, key: 'kpYellowOrange', min: 4, max: 8 },
          { label: `Kp ORANGE→RED (${settings.kpOrangeRed})`, key: 'kpOrangeRed', min: 5, max: 9 },
        ].map(s => (
          <SettingsRow key={s.key} label={s.label} tooltip={t('tooltip_kp_threshold', 'Alert notifications trigger when Kp index exceeds this value.')}>
            <input type="range" min={s.min} max={s.max} value={settings[s.key]}
              onChange={e => updateSetting(s.key, parseInt(e.target.value))}
              style={{ width: 200, accentColor: 'var(--cyan)' }} />
          </SettingsRow>
        ))}
        <SettingsRow label={t('Flair Sınıfı Eşiği', 'Flare Class Threshold')} tooltip={t('tooltip_flare_threshold')}>
          <select value={settings.flareThreshold} onChange={e => updateSetting('flareThreshold', e.target.value)}
            className="font-data" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 11, outline: 'none' }}>
            <option value="C">{t('C Sınıfı Üzeri', 'Above C Class')}</option>
            <option value="M">{t('M Sınıfı Üzeri', 'Above M Class')}</option>
            <option value="X">{t('X Işını', 'X-Ray Only')}</option>
          </select>
        </SettingsRow>
        <SettingsRow label={`${t('M+ Olasılık', 'M+ Prob.')} ${t('Eşiği', 'Threshold')}: %${settings.probThreshold}`} tooltip={t('tooltip_prob_threshold')}>
          <input type="range" min={10} max={90} value={settings.probThreshold}
            onChange={e => updateSetting('probThreshold', parseInt(e.target.value))}
            style={{ width: 200, accentColor: 'var(--cyan)' }} />
        </SettingsRow>
      </SettingsSection>


      {/* Appearance */}
      <SettingsSection title={t('Görünüm', 'Appearance')}>
        <SettingsRow label={t('Dil', 'Language')}>
          <div className="flex gap-2">
            {['TR', 'EN'].map(lang => (
              <button key={lang} onClick={() => updateSetting('language', lang)} className="font-data"
                style={{ padding: '4px 14px', borderRadius: 4, fontSize: 10, border: `1px solid ${settings.language === lang ? 'var(--cyan)' : 'var(--border-subtle)'}`, background: settings.language === lang ? 'var(--cyan-glow)' : 'transparent', color: settings.language === lang ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {lang}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label={t('Globe Kalitesi', 'Globe Quality')} tooltip={t('tooltip_globe_quality', 'Controls globe rendering quality. Low mode is faster, high mode shows more detail.')}>
          <div className="flex gap-2">
            {[
              { id: 'Düşük', label: t('Düşük', 'Low') },
              { id: 'Orta', label: 'Orta' },
              { id: 'Yüksek', label: t('Yüksek', 'High') }
            ].map(q => (
              <button key={q.id} onClick={() => updateSetting('globeQuality', q.id)} className="font-data"
                style={{ padding: '4px 14px', borderRadius: 4, fontSize: 10, border: `1px solid ${settings.globeQuality === q.id ? 'var(--cyan)' : 'var(--border-subtle)'}`, background: settings.globeQuality === q.id ? 'var(--cyan-glow)' : 'transparent', color: settings.globeQuality === q.id ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {q.label}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label={t('Animasyonlar', 'Animations')} tooltip={t('tooltip_animations', 'Toggles motion animations on page transitions and UI components. Disabling improves performance.')}>
          <Toggle checked={settings.animations} onChange={v => updateSetting('animations', v)} />
        </SettingsRow>
        <SettingsRow label={t('Scanline Efekti', 'Scanline Effect')} tooltip={t('tooltip_scanline', 'Retro CRT monitor effect. When enabled, horizontal scan lines appear on screen.')}>
          <Toggle checked={settings.scanlines} onChange={v => updateSetting('scanlines', v)} />
        </SettingsRow>
      </SettingsSection>

      {/* About */}
      <SettingsSection title={t('Hakkında', 'About')}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 2 }}>
          <strong style={{ color: 'var(--cyan)' }}>SolarGuard-TR v2.0.0</strong><br/>
          TUA Astro Hackathon 2026<br/>
          Veri Kaynakları: NASA DONKI, NOAA GOES, TUA API<br/>
          Model: Time-Series LLM (Zero-Shot) + XGBoost Ensemble<br/>
          <a href="#" style={{ color: 'var(--cyan-dim)', textDecoration: 'none' }}>GitHub Repository →</a>
        </div>
      </SettingsSection>
    </motion.div>
  )
}
