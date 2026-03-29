export default function StatusDot({ color = 'var(--green)', size = 8, pulse = true }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 ${size}px ${color}`,
        animation: pulse ? 'pulse-cyan 2s ease-in-out infinite' : 'none',
      }}
    />
  )
}
