import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, ComposedChart } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(5,6,15,0.95)', border: '1px solid var(--border-accent)',
      borderRadius: 8, padding: '10px 14px', fontFamily: "'Space Mono', monospace", fontSize: 10,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Saat: +{label}h</div>
      {payload.map((p, i) => {
        // Force readable color for confidence band entries (they have transparent fill)
        const displayColor = (p.dataKey === 'kp_upper_ci' || p.dataKey === 'kp_lower_ci')
          ? 'rgba(0,255,240,0.6)' : p.color
        return (
          <div key={i} style={{ color: displayColor, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </div>
        )
      })}
    </div>
  )
}

export default function KpForecastChart({ data = [], height = 200, showLegend = false, mini = false }) {
  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={0}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: mini ? -20 : 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="hour"
          stroke="var(--text-dim)"
          tick={{ fontSize: 9, fontFamily: "'Space Mono', monospace", fill: 'var(--text-dim)' }}
          tickFormatter={v => `${v}h`}
          interval={mini ? 23 : 11}
          label={!mini ? { value: 'Saat', position: 'insideBottomRight', offset: -5, fill: 'var(--text-muted)', fontSize: 10 } : undefined}
        />
        <YAxis
          domain={[0, 9]}
          stroke="var(--text-dim)"
          tick={{ fontSize: 9, fontFamily: "'Space Mono', monospace", fill: 'var(--text-dim)' }}
          label={!mini ? { value: 'Kp İndeksi', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 } : undefined}
        />
        <Tooltip content={<CustomTooltip />} />

        {!mini && (
          <>
            <ReferenceLine y={5} stroke="var(--alert-yellow)" strokeDasharray="5 5" label={{ value: 'G1', fill: 'var(--alert-yellow)', fontSize: 9 }} />
            <ReferenceLine y={7} stroke="var(--alert-orange)" strokeDasharray="5 5" label={{ value: 'G3', fill: 'var(--alert-orange)', fontSize: 9 }} />
            <ReferenceLine y={9} stroke="var(--alert-red)" strokeDasharray="5 5" label={{ value: 'G5', fill: 'var(--alert-red)', fontSize: 9 }} />
          </>
        )}

        <Area type="monotone" dataKey="kp_upper_ci" stroke="none" fill="rgba(0,255,240,0.08)" stackId="conf" name="Üst Güven" />
        <Area type="monotone" dataKey="kp_lower_ci" stroke="none" fill="var(--bg-void)" stackId="conf" name="Alt Güven" />

        <Line type="monotone" dataKey="kp_lstm" stroke="var(--chart-lstm)" strokeWidth={2.5} dot={false} name="LSTM" />
        <Line type="monotone" dataKey="kp_xgb" stroke="var(--chart-xgb)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="XGBoost" />
        <Line type="monotone" dataKey="kp_baseline" stroke="var(--chart-baseline)" strokeWidth={1} strokeDasharray="2 2" dot={false} name="Baseline" />

        {showLegend && <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)' }} />}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
