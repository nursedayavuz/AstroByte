import { useState } from 'react'
import { motion } from 'framer-motion'

const MAJOR_EVENTS = [
  { id: 'ev1', time: '23:30', intensity: 8.1, type: 'Solar Flare (X-Class)',
    detail: { classType: 'X8.1', dateStr: 'T-0 Olay Başlangıcı', source: 'AR14366 (S17W25)', begin: '23:30 UTC', peak: '23:44 UTC', end: '00:15 UTC (+1 gün)', duration: '45 dakika',
              linked: ['HF Radyo kesintisi (R3)'], prediction: ['Büyük CME ihtimali %85'] }},
  { id: 'ev2', time: '00:31', intensity: 2.8, type: 'Solar Flare (X-Class)',
    detail: { classType: 'X2.8', dateStr: 'T+1 Saat', source: 'AR14366 (S18W28)', begin: '00:20 UTC', peak: '00:31 UTC', end: '01:05 UTC', duration: '45 dakika', linked: ['CME başlatıldı'], prediction: ['Ardışık patlama algılandı'] }},
  { id: 'ev3', time: '06:00', intensity: 7.2, type: 'Geomagnetic Storm',
    detail: { classType: 'Kp=7.2', dateStr: 'T+6 Saat', source: 'CME kaynaklı', begin: '05:30 UTC', peak: '06:00 UTC', end: '14:00 UTC', duration: '8.5 saat', linked: ['G3 seviyesi fırtına'], prediction: ['Fırtına tahmin edildi'] }},
  { id: 'ev4', time: '12:02', intensity: 4.2, type: 'Solar Flare (M-Class)',
    detail: { classType: 'X4.2', dateStr: 'T+12 Saat', source: 'AR14366 (S16W32)', begin: '11:50 UTC', peak: '12:02 UTC', end: '12:45 UTC', duration: '55 dakika', linked: ['CME hızı 2400 km/s'], prediction: ['3. büyük patlama algılandı'] }},
  { id: 5, date: '18 Oca', time: '17:27', type: 'X', label: 'X1.9 Sınıfı Patlama', color: '#ffdc00', severity: 'moderate',
    detail: { classType: 'X1.9', dateStr: '18 Ocak 2026, 17:27 UTC', source: 'N12E45', begin: '17:10 UTC', peak: '17:27 UTC', end: '18:00 UTC', duration: '50 dakika', linked: [], prediction: [] }},
  { id: 6, date: '15 Oca', time: '08:15', type: 'M', label: 'M7.3 Sınıfı Patlama', color: '#ff8c42', severity: 'warning',
    detail: { classType: 'M7.3', dateStr: '15 Ocak 2026, 08:15 UTC', source: 'S20W10', begin: '08:00 UTC', peak: '08:15 UTC', end: '08:40 UTC', duration: '40 dakika', linked: ['CME bağlantılı'], prediction: [] }},
]

export default function EventReplayPage() {
  const [selected, setSelected] = useState(MAJOR_EVENTS[0])

  return (
    <motion.div
      className="flex flex-col h-full p-4 gap-4 overflow-hidden"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
    >
      {/* Timeline */}
      <div className="glass-card p-5" style={{ height: 130 }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            İNTERAKTİF ZAMAN ÇİZGİSİ — Ocak - Mart 2026
          </span>
        </div>
        <div style={{ position: 'relative', height: 60 }}>
          {/* Track line */}
          <div style={{ position: 'absolute', top: 25, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)' }} />
          {/* Events on timeline */}
          {MAJOR_EVENTS.map((evt, i) => {
            const leftPercent = 10 + (i / (MAJOR_EVENTS.length - 1)) * 80
            const isSelected = selected?.id === evt.id
            const sizeMap = { X: 14, M: 10, GST: 12, C: 8 }
            const size = sizeMap[evt.type] || 10
            return (
              <div
                key={evt.id}
                onClick={() => setSelected(evt)}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: 25 - size / 2,
                  width: size,
                  height: size,
                  borderRadius: evt.type === 'GST' ? 2 : '50%',
                  transform: evt.type === 'GST' ? 'rotate(45deg)' : 'none',
                  background: evt.color,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #fff' : 'none',
                  boxShadow: isSelected ? `0 0 12px ${evt.color}` : `0 0 4px ${evt.color}`,
                  zIndex: isSelected ? 5 : 2,
                  transition: 'all 0.2s',
                }}
                title={evt.label}
              />
            )
          })}
          {/* Labels below */}
          {MAJOR_EVENTS.map((evt, i) => {
            const leftPercent = 10 + (i / (MAJOR_EVENTS.length - 1)) * 80
            return (
              <div key={`lbl-${evt.id}`} className="font-data" style={{
                position: 'absolute', left: `${leftPercent}%`, top: 42, transform: 'translateX(-50%)',
                fontSize: 7, color: selected?.id === evt.id ? evt.color : 'var(--text-dim)', whiteSpace: 'nowrap',
              }}>
                {evt.date}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail + Event List */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Selected Event Detail */}
        <div className="flex-1 glass-card p-5 overflow-auto">
          {selected && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: selected.color }} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>{selected.detail.classType} SINIFI GÜNEŞ PATLAMASI</span>
              </div>

              <div className="font-data" style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 2 }}>
                Tarih: {selected.detail.dateStr}<br/>
                Kaynak: {selected.detail.source}<br/>
                Başlangıç: {selected.detail.begin}<br/>
                Pik: {selected.detail.peak}<br/>
                Bitiş: {selected.detail.end}<br/>
                Süre: {selected.detail.duration}
              </div>

              {selected.detail.linked.length > 0 && (
                <div className="mt-4">
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Bağlı Olaylar:</div>
                  {selected.detail.linked.map((l, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--amber)', marginBottom: 2 }}>→ {l}</div>
                  ))}
                </div>
              )}

              {selected.detail.prediction.length > 0 && (
                <div className="mt-4">
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>SolarGuard-TR Tahmini:</div>
                  {selected.detail.prediction.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--green)', marginBottom: 2 }}>✅ {p}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event List */}
        <div className="flex flex-col gap-2 overflow-auto" style={{ width: 320 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
            ÖNEMLI OLAYLAR
          </div>
          {MAJOR_EVENTS.map(evt => (
            <div
              key={evt.id}
              onClick={() => setSelected(evt)}
              className="glass-card p-3"
              style={{
                borderLeft: `3px solid ${evt.color}`,
                cursor: 'pointer',
                background: selected?.id === evt.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12 }}>{evt.severity === 'critical' ? '🔴' : evt.severity === 'warning' ? '🟠' : '🟡'}</span>
                <span className="font-data" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{evt.date} {evt.time}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{evt.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Starlink Comparison Banner */}
      <div className="glass-card p-4 flex gap-4">
        <div className="flex-1 p-4 rounded-lg" style={{ background: 'rgba(255,34,34,0.06)', border: '1px solid rgba(255,34,34,0.15)' }}>
          <div className="font-data" style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, marginBottom: 8 }}>ŞUBAT 2022: STARLİNK FELAKETİ</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            • 40 uydu atmosferde yanarak yok oldu<br/>
            • Erken uyarı sistemi YOKTU<br/>
            • Tahmini kayıp: $50M+<br/>
            • SpaceX güvenli mod çalıştıramadı
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--amber)' }}>bolt</span>
            <span className="font-data" style={{ fontSize: 10, color: 'var(--text-dim)' }}>VS</span>
          </div>
        </div>
        <div className="flex-1 p-4 rounded-lg" style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)' }}>
          <div className="font-data" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>SOLARGUARD-TR ÇÖZÜMÜ</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            • 24 saat önceden olay tahmini<br/>
            • Otomatik güvenli mod uyarısı<br/>
            • 5 Türk uydusu korunabilirdi<br/>
            • TEDAŞ şebekesi hazırlanabilirdi
          </div>
        </div>
      </div>
    </motion.div>
  )
}
