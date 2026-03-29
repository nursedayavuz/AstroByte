import RiskBar from '../shared/RiskBar'
import { getRiskColor } from '../../utils/formatters'

export default function SatelliteRow({ satellite }) {
  const color = getRiskColor(satellite.level)
  return (
    <div className="glass-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${color}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>satellite_alt</span>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, fontWeight: 600 }}>{satellite.name}</span>
          <span className="font-data" style={{ fontSize: 10, color, padding: '1px 8px', borderRadius: 4, border: `1px solid ${color}`, background: `${color}15` }}>
            {satellite.orbit}
          </span>
        </div>
        <RiskBar value={satellite.risk} level={satellite.level} className="mt-1" />
        <div className="flex justify-between mt-1">
          <span className="font-data" style={{ fontSize: 9, color: 'var(--text-muted)' }}>{satellite.alt_km.toLocaleString()} km</span>
          <span className="font-data" style={{ fontSize: 11, color, fontWeight: 700 }}>{Math.round(satellite.risk * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
