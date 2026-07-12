import { ref } from 'vue'
import { useMetricsStore } from '../stores/metrics'
import {
  pearsonCorrelation, detectTrend, calculateMovingAverage,
  detectAnomalies, analyzeDayOfWeek, generateComprehensiveInsights
} from '../utils/correlations'

export function useInsights() {
  const metricsStore = useMetricsStore()
  const insights = ref([])
  const correlations = ref([])
  const trends = ref({})
  const anomalies = ref({})
  const dayPatterns = ref({})
  const loading = ref(false)

  async function computeInsights(enabledMetrics) {
    loading.value = true
    try {
      const allEntries = await metricsStore.getAllEntries()
      // Exclude daily_note and custom notes from numeric analysis
      const numericEntries = allEntries.filter(e => e.metric !== 'daily_note')
      if (numericEntries.length < 7) {
        insights.value = []
        correlations.value = []
        return
      }

      // Group entries by date
      const byDate = {}
      for (const entry of numericEntries) {
        if (!byDate[entry.date]) byDate[entry.date] = {}
        byDate[entry.date][entry.metric] = entry.value
      }

      const dates = Object.keys(byDate).sort()

      // Compute pairwise correlations (lowered threshold to 7 days)
      const pairs = []

      for (let i = 0; i < enabledMetrics.length; i++) {
        for (let j = i + 1; j < enabledMetrics.length; j++) {
          const metricA = enabledMetrics[i]
          const metricB = enabledMetrics[j]
          // Skip non-numeric metrics
          if (metricA === 'daily_note' || metricB === 'daily_note') continue

          const commonDates = dates.filter(d =>
            byDate[d][metricA] !== undefined && byDate[d][metricB] !== undefined
          )

          if (commonDates.length < 7) continue

          const x = commonDates.map(d => byDate[d][metricA])
          const y = commonDates.map(d => byDate[d][metricB])

          const r = pearsonCorrelation(x, y)

          pairs.push({
            metricA,
            metricB,
            r,
            dataPoints: commonDates.length,
          })
        }
      }

      correlations.value = pairs

      // Generate comprehensive insights
      insights.value = generateComprehensiveInsights(numericEntries, enabledMetrics.filter(m => m !== 'daily_note'))

      // Compute trends
      for (const metric of enabledMetrics) {
        if (metric === 'daily_note') continue
        const metricEntries = numericEntries.filter(e => e.metric === metric)
        const values = metricEntries.map(e => e.value)
        trends.value[metric] = detectTrend(values)

        // Detect anomalies
        anomalies.value[metric] = detectAnomalies(values)

        // Day-of-week patterns
        dayPatterns.value[metric] = analyzeDayOfWeek(numericEntries, metric)
      }
    } finally {
      loading.value = false
    }
  }

  function getScatterData(entries, metricA, metricB) {
    const byDate = {}
    for (const entry of entries) {
      if (!byDate[entry.date]) byDate[entry.date] = {}
      byDate[entry.date][entry.metric] = entry.value
    }

    const dates = Object.keys(byDate).sort()
    return dates
      .filter(d => byDate[d][metricA] !== undefined && byDate[d][metricB] !== undefined)
      .map(d => [byDate[d][metricA], byDate[d][metricB]])
  }

  function getTrendData(entries, metric) {
    const sorted = entries
      .filter(e => e.metric === metric)
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      dates: sorted.map(e => e.date),
      values: sorted.map(e => e.value),
      movingAvg: calculateMovingAverage(sorted.map(e => e.value)),
    }
  }

  return {
    insights,
    correlations,
    trends,
    anomalies,
    dayPatterns,
    loading,
    computeInsights,
    getScatterData,
    getTrendData,
  }
}
