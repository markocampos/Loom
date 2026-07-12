export function parseDate(date) {
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(date.replace(/-/g, '/'))
  }
  return new Date(date)
}

export function formatDate(date) {
  const d = parseDate(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(date) {
  const d = parseDate(date)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatFullDate(date) {
  const d = parseDate(date)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatMetricValue(metricId, value) {
  switch (metricId) {
    case 'mood':
      return `${value}/10`
    case 'sleep':
      return formatTime(value)
    case 'coffee':
      return `${value} cup${value !== 1 ? 's' : ''}`
    case 'steps':
      return formatNumber(value)
    case 'screen_time':
      return formatTime(value)
    default:
      return String(value)
  }
}

export function getToday() {
  return formatDate(new Date())
}

export function getDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatDate(d)
}

export function getWeekDates() {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    dates.push(getDaysAgo(i))
  }
  return dates
}

export function getMonthDates() {
  const dates = []
  for (let i = 29; i >= 0; i--) {
    dates.push(getDaysAgo(i))
  }
  return dates
}
