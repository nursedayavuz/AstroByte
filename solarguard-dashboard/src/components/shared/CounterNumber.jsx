import { useEffect, useState } from 'react'

export default function CounterNumber({ value, duration = 1000, className = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0
    const start = display
    const startTime = Date.now()

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (target - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value])

  const formatted = Number.isInteger(value) ? Math.round(display) : display.toFixed(1)

  return (
    <span className={`font-data ${className}`} style={{ animation: 'counter-roll 0.6s ease-out' }}>
      {formatted}
    </span>
  )
}
