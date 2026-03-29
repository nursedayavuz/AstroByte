import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

export default function RiskGaugeChart({ value = 0, color = 'var(--cyan)', label = '', size = 120 }) {
  const data = [{ value: value * 100, fill: color }]

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={size} height={size}>
        <RadialBarChart
          cx="50%" cy="50%" innerRadius="70%" outerRadius="90%"
          startAngle={180} endAngle={0}
          data={data}
        >
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.06)' }}
            dataKey="value"
            cornerRadius={4}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="font-data" style={{ fontSize: 18, fontWeight: 700, color, marginTop: -30 }}>
        %{Math.round(value * 100)}
      </div>
      {label && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>}
    </div>
  )
}
