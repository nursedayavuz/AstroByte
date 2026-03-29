import { useMemo } from 'react'

const LEVEL_CONFIG = {
  GREEN: { label: "NORMAL", bg: "rgba(0,255,136,0.1)", border: "var(--alert-green)", text: "var(--alert-green)" },
  YELLOW: { label: "DİKKATLİ", bg: "rgba(255,220,0,0.1)", border: "var(--alert-yellow)", text: "var(--alert-yellow)" },
  ORANGE: { label: "UYARI", bg: "rgba(255,140,0,0.1)", border: "var(--alert-orange)", text: "var(--alert-orange)" },
  RED: { label: "KRİTİK", bg: "rgba(255,34,34,0.1)", border: "var(--alert-red)", text: "var(--alert-red)" },
}

export function useAlertLevel(level = "RED") {
  return useMemo(() => LEVEL_CONFIG[level] || LEVEL_CONFIG.GREEN, [level])
}
