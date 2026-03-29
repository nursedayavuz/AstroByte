import RiskBar from '../shared/RiskBar'
import { getRiskColor } from '../../utils/formatters'
import { ASSET_TYPE_LABELS } from '../../utils/constants'

export default function GroundAssetCard({ asset = {} }) {
  const color = getRiskColor(asset.level || 'GREEN')
  const typeLabel = ASSET_TYPE_LABELS[asset.type] || asset.type || 'Bilinmiyor'
  const iconMap = { power_grid: 'bolt', satellite_control: 'satellite_alt', research_station: 'science' }
  const risk = asset.risk ?? 0
  const criticality = asset.criticality ?? 0.5

  return (
    <div className="glass-card p-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{iconMap[asset.type] || 'location_on'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>{asset.name}</span>
        </div>
        <span className="font-data" style={{ fontSize: 10, color, fontWeight: 700 }}>{asset.level}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Tür: {typeLabel}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
        Konum: {asset.lat}°N, {asset.lon}°E
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
        Kritiklik: %{Math.round(criticality * 100)}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>GIC Risk Skoru:</span>
        <span className="font-data" style={{ fontSize: 12, color, fontWeight: 700 }}>{risk.toFixed(2)}</span>
      </div>
      <RiskBar value={risk} level={asset.level || 'GREEN'} />
    </div>
  )
}
