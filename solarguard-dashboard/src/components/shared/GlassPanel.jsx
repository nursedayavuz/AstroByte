export default function GlassPanel({ children, className = '', style = {} }) {
  return (
    <div className={`glass-card ${className}`} style={style}>
      {children}
    </div>
  )
}
