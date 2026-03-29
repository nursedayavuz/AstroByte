import { useAlertLevel } from '../../hooks/useAlertLevel'

export default function AlertBadge({ level = "RED" }) {
  const config = useAlertLevel(level)
  const isRed = level === "RED"

  return (
    <div
      className={`flex items-center gap-2 px-5 rounded-full ${isRed ? 'alert-pulse-red' : ''}`}
      style={{
        height: 36,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <span
        className={`material-symbols-outlined ${isRed ? 'material-filled' : ''}`}
        style={{ fontSize: 16, color: config.text }}
      >
        warning
      </span>
      <span
        className={`font-data font-bold uppercase tracking-wider ${isRed ? 'glow-text' : ''}`}
        style={{ fontSize: 11, color: config.text }}
      >
        {config.label}
      </span>
    </div>
  )
}
