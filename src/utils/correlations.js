export function pearsonCorrelation(x, y) {
  const n = x.length
  if (n < 3) return null

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
  const sumX2 = x.reduce((a, b) => a + b * b, 0)
  const sumY2 = y.reduce((a, b) => a + b * b, 0)

  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (den === 0) return 0
  return Math.round((num / den) * 100) / 100
}

export function classifyCorrelation(r) {
  if (r === null) return { strength: 'insufficient', direction: 'none' }
  const abs = Math.abs(r)
  const strength = abs > 0.6 ? 'strong' : abs > 0.3 ? 'moderate' : 'weak'
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'none'
  return { strength, direction }
}

export function generateInsight(metricA, metricB, r, dataPoints) {
  if (r === null || dataPoints < 7) {
    return null
  }

  const { strength, direction } = classifyCorrelation(r)
  const names = {
    mood: 'your mood',
    sleep: 'sleep',
    coffee: 'coffee intake',
    steps: 'steps',
    screen_time: 'screen time',
  }

  const nameA = names[metricA] || metricA
  const nameB = names[metricB] || metricB

  if (strength === 'weak') {
    return null
  }

  const abs = Math.abs(r)
  const confidence = abs > 0.6 ? 'strong' : 'moderate'

  if (direction === 'positive') {
    if (strength === 'strong') {
      return `Higher ${nameA} strongly correlates with higher ${nameB} (r=${r})`
    }
    return `More ${nameA} is linked to more ${nameB} (r=${r})`
  }

  if (direction === 'negative') {
    if (strength === 'strong') {
      return `Higher ${nameA} strongly correlates with lower ${nameB} (r=${r})`
    }
    return `More ${nameA} is linked to less ${nameB} (r=${r})`
  }

  return null
}

export function detectTrend(values) {
  if (values.length < 7) return { direction: 'unknown', change: 0 }

  const recent = values.slice(-7)
  const previous = values.slice(-14, -7)

  if (previous.length === 0) {
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    return { direction: avg > 5 ? 'up' : 'down', change: 0 }
  }

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length
  const change = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0

  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
    change: Math.round(change),
  }
}

export function calculateMovingAverage(values, window = 7) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

// Anomaly detection using z-score
export function detectAnomalies(values, threshold = 2) {
  if (values.length < 7) return []

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)

  if (stdDev === 0) return []

  return values.map((v, i) => {
    const zScore = (v - mean) / stdDev
    return {
      index: i,
      value: v,
      zScore: Math.round(zScore * 100) / 100,
      isAnomaly: Math.abs(zScore) > threshold,
      type: zScore > threshold ? 'high' : zScore < -threshold ? 'low' : 'normal',
    }
  }).filter(a => a.isAnomaly)
}

// Day-of-week pattern analysis
export function analyzeDayOfWeek(entries, metricId) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayTotals = {}
  const dayCounts = {}

  for (const e of entries) {
    if (e.metric !== metricId) continue
    const dayOfWeek = new Date(e.date).getDay()
    if (!dayTotals[dayOfWeek]) {
      dayTotals[dayOfWeek] = 0
      dayCounts[dayOfWeek] = 0
    }
    dayTotals[dayOfWeek] += e.value
    dayCounts[dayOfWeek]++
  }

  const averages = dayNames.map((name, i) => ({
    day: name,
    dayIndex: i,
    avg: dayCounts[i] ? Math.round((dayTotals[i] / dayCounts[i]) * 10) / 10 : null,
    count: dayCounts[i] || 0,
  }))

  const withData = averages.filter(a => a.avg !== null)
  const best = withData.length ? withData.reduce((a, b) => a.avg > b.avg ? a : b) : null
  const worst = withData.length ? withData.reduce((a, b) => a.avg < b.avg ? a : b) : null

  return { averages, best, worst }
}

// Generate comprehensive insights
export function generateComprehensiveInsights(entries, enabledMetrics) {
  const insights = []
  const byDate = {}
  for (const entry of entries) {
    if (!byDate[entry.date]) byDate[entry.date] = {}
    byDate[entry.date][entry.metric] = entry.value
  }

  const dates = Object.keys(byDate).sort()

  // Correlation insights
  for (let i = 0; i < enabledMetrics.length; i++) {
    for (let j = i + 1; j < enabledMetrics.length; j++) {
      const mA = enabledMetrics[i]
      const mB = enabledMetrics[j]
      const commonDates = dates.filter(d =>
        byDate[d][mA] !== undefined && byDate[d][mB] !== undefined
      )
      if (commonDates.length < 7) continue

      const x = commonDates.map(d => byDate[d][mA])
      const y = commonDates.map(d => byDate[d][mB])
      const r = pearsonCorrelation(x, y)
      const insight = generateInsight(mA, mB, r, commonDates.length)
      if (insight) insights.push(insight)
    }
  }

  // Anomaly insights
  for (const metric of enabledMetrics) {
    const metricEntries = entries.filter(e => e.metric === metric)
    const values = metricEntries.map(e => e.value)
    const anomalies = detectAnomalies(values)
    if (anomalies.length > 0) {
      const recent = anomalies[anomalies.length - 1]
      const name = { mood: 'mood', sleep: 'sleep', coffee: 'coffee intake', steps: 'steps', screen_time: 'screen time' }[metric] || metric
      if (recent.type === 'high') {
        insights.push(`Your ${name} was unusually high on ${metricEntries[recent.index]?.date || 'a recent day'}`)
      } else {
        insights.push(`Your ${name} was unusually low on ${metricEntries[recent.index]?.date || 'a recent day'}`)
      }
    }
  }

  // Day-of-week insights
  for (const metric of enabledMetrics) {
    const pattern = analyzeDayOfWeek(entries, metric)
    if (pattern.best && pattern.worst && pattern.best.day !== pattern.worst.day) {
      const name = { mood: 'mood', sleep: 'sleep', coffee: 'coffee intake', steps: 'steps', screen_time: 'screen time' }[metric] || metric
      insights.push(`Your ${name} tends to be highest on ${pattern.best.day}s and lowest on ${pattern.worst.day}s`)
    }
  }

  return insights.slice(0, 10) // Cap at 10 insights
}
