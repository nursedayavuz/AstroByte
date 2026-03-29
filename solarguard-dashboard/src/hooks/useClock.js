import { useState, useEffect } from 'react'

export function useClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const utcString = time.toISOString().slice(11, 19)
  return { time, utcString }
}
