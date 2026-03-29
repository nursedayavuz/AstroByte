export default function EventLogEntry({ entry }) {
  const severityColors = {
    critical: 'var(--red)',
    warning: 'var(--orange)',
    moderate: 'var(--alert-yellow)',
    info: 'var(--green)',
  }

  const borderColor = severityColors[entry.severity] || 'var(--text-muted)'

  return (
    <div
      className="glass-card p-3 slide-in-up"
      style={{ borderLeft: `3px solid ${borderColor}`, marginBottom: 8, cursor: 'pointer' }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span className="font-data" style={{ fontSize: 10, color: borderColor }}>
          {entry.icon} {entry.time}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{entry.date}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{entry.title}</div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{entry.desc}</div>
      {entry.assets?.length > 0 && (
        <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
          {entry.assets.map(a => (
            <span key={a} className="font-data" style={{ fontSize: 8, color: 'var(--cyan-dim)', padding: '1px 6px', borderRadius: 4, background: 'var(--cyan-glow)' }}>
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
