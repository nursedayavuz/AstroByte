import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ConfidenceChart({ data = [], height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="hour" stroke="var(--text-dim)" tick={{ fontSize: 9, fill: 'var(--text-dim)' }} tickFormatter={v => `${v}h`} interval={23} />
        <YAxis domain={[0, 9]} stroke="var(--text-dim)" tick={{ fontSize: 9, fill: 'var(--text-dim)' }} />
        <Tooltip contentStyle={{ background: 'rgba(5,6,15,0.95)', border: '1px solid var(--border-accent)', borderRadius: 8, fontFamily: "'Space Mono', monospace", fontSize: 10 }} />
        <Area type="monotone" dataKey="kp_upper_ci" stroke="var(--cyan-dim)" fill="rgba(0,255,240,0.1)" strokeWidth={1} name="Üst Güven" />
        <Area type="monotone" dataKey="kp_lower_ci" stroke="var(--cyan-dim)" fill="rgba(0,255,240,0.05)" strokeWidth={1} name="Alt Güven" />
        <Area type="monotone" dataKey="kp_lstm" stroke="var(--cyan)" fill="rgba(0,255,240,0.15)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
