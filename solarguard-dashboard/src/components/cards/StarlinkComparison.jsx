export default function StarlinkComparison() {
  return (
    <div className="glass-card p-4">
      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
        Karşılaştırma: Şubat 2022 Starlink Olayı
      </div>
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-lg" style={{ background: 'rgba(255,34,34,0.08)', border: '1px solid rgba(255,34,34,0.2)' }}>
          <div className="font-data" style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, marginBottom: 6 }}>STARLINK 2022</div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            • 40 uydu yok oldu<br/>
            • Erken uyarı YOK<br/>
            • ~$50M+ kayıp
          </div>
        </div>
        <div className="flex items-center">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--amber)' }}>bolt</span>
        </div>
        <div className="flex-1 p-3 rounded-lg" style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <div className="font-data" style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>SOLARGUARD-TR</div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            • 24h önceden tahmin<br/>
            • Otomatik güvenli mod<br/>
            • 5 uydu korunur
          </div>
        </div>
      </div>
    </div>
  )
}
