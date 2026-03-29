export function formatUTCTime(date) {
  return date.toISOString().slice(11, 19)
}

export function formatPercent(value) {
  return `%${Math.round(value * 100)}`
}

export function formatRisk(value) {
  return value.toFixed(2)
}

export function getRiskClass(level) {
  const map = { GREEN: 'risk-green', YELLOW: 'risk-yellow', ORANGE: 'risk-orange', RED: 'risk-red' }
  return map[level] || 'risk-green'
}

export function getRiskColor(level) {
  const map = { GREEN: 'var(--alert-green)', YELLOW: 'var(--alert-yellow)', ORANGE: 'var(--alert-orange)', RED: 'var(--alert-red)' }
  return map[level] || 'var(--alert-green)'
}

export function getFlareColor(classType) {
  if (classType.startsWith('X')) return 'var(--red)'
  if (classType.startsWith('M')) return 'var(--orange)'
  if (classType.startsWith('C')) return 'var(--alert-yellow)'
  return 'var(--text-muted)'
}

export function formatDate(isoString) {
  const d = new Date(isoString)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${String(d.getUTCDate()).padStart(2, '0')} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatTime(isoString) {
  const d = new Date(isoString)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}
