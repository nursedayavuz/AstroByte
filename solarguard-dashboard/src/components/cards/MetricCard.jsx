export default function MetricCard({ label, value, suffix = '', color = 'var(--text-primary)' }) {
  return (
    <div className="glass-card p-3 text-center">
      <div style={{ fontSize: 8, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div className="font-data font-bold" style={{ fontSize: 18, color, marginTop: 4 }}>
        {value}
        {suffix && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{suffix}</span>}
      </div>
    </div>
  )
}
