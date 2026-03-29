import { getRiskClass } from '../../utils/formatters'

export default function RiskBar({ value, level, className = '' }) {
  const riskClass = getRiskClass(level)
  const percent = Math.min(value * 100, 100)
  return (
    <div
      className={`risk-bar ${riskClass} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Risk seviyesi: %${Math.round(percent)} — ${level}`}
    >
      <div className="risk-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}
