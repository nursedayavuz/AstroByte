import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { formatDate } from '../../utils/formatters'

function flareClassToNumeric(classType) {
  const letter = classType[0]
  const num = parseFloat(classType.slice(1)) || 1
  const base = { A: 0, B: 1, C: 2, M: 3, X: 4 }
  return (base[letter] || 0) + num / 10
}

function getBarColor(classType) {
  if (classType.startsWith('X')) return '#ff2222'
  if (classType.startsWith('M')) return '#ff8c42'
  if (classType.startsWith('C')) return '#ffdc00'
  return '#555577'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'rgba(5,6,15,0.95)', border: '1px solid var(--border-accent)',
      borderRadius: 8, padding: '8px 12px', fontFamily: "'Space Mono', monospace", fontSize: 10,
    }}>
      <div style={{ color: 'var(--text-muted)' }}>{formatDate(d.peakTime)}</div>
      <div style={{ color: getBarColor(d.classType), fontWeight: 700, fontSize: 14 }}>{d.classType}</div>
      {d.linkedCME && <div style={{ color: 'var(--cyan-dim)', fontSize: 9 }}>CME Bağlantılı</div>}
    </div>
  )
}

export default function FlareHistoryChart({ data = [], height = 300 }) {
  const chartData = data.map(f => ({
    ...f,
    value: flareClassToNumeric(f.classType),
    date: formatDate(f.peakTime),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="var(--text-dim)" tick={{ fontSize: 9, fontFamily: "'Space Mono', monospace", fill: 'var(--text-dim)' }} />
        <YAxis domain={[0, 5]} stroke="var(--text-dim)" tick={{ fontSize: 9, fontFamily: "'Space Mono', monospace", fill: 'var(--text-dim)' }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={3} stroke="var(--orange)" strokeDasharray="5 5" />
        <ReferenceLine y={4} stroke="var(--red)" strokeDasharray="5 5" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.classType)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
