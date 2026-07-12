<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Minus, BarChart3,
  Trophy, AlertTriangle, ArrowUpRight, ArrowDownRight, Flame
} from '@lucide/vue'
import { useMetricsStore } from '../stores/metrics'
import { useSettingsStore } from '../stores/settings'
import { getAllMetrics } from '../data/defaultMetrics'
import { getToday, getDaysAgo, formatMetricValue } from '../utils/formatters'

const router = useRouter()
const metricsStore = useMetricsStore()
const settingsStore = useSettingsStore()

const period = ref('week') // 'week' | 'month'
const allEntries = ref([])

const allMetrics = computed(() =>
  getAllMetrics(settingsStore.settings.customMetrics)
)

const enabledMetrics = computed(() =>
  allMetrics.value.filter(m => settingsStore.settings.enabledMetrics.includes(m.id))
)

onMounted(async () => {
  await settingsStore.loadSettings()
  allEntries.value = await metricsStore.getAllEntries()
})

const currentRange = computed(() => {
  const today = getToday()
  const days = period.value === 'week' ? 7 : 30
  const start = getDaysAgo(days - 1)
  return { start, end: today, days }
})

const previousRange = computed(() => {
  const days = period.value === 'week' ? 7 : 30
  const start = getDaysAgo(days * 2 - 1)
  const end = getDaysAgo(days)
  return { start, end, days }
})

function getEntriesInRange(start, end) {
  return allEntries.value.filter(e => e.date >= start && e.date <= end)
}

function groupByMetric(entries) {
  const grouped = {}
  for (const e of entries) {
    if (!grouped[e.metric]) grouped[e.metric] = []
    grouped[e.metric].push(e.value)
  }
  return grouped
}

function avg(arr) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

function bestDay(entries) {
  const byDate = {}
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = new Set()
    byDate[e.date].add(e.metric)
  }
  let best = null
  let bestScore = -1
  for (const [date, metrics] of Object.entries(byDate)) {
    const score = metrics.size
    if (score > bestScore) {
      bestScore = score
      best = date
    }
  }
  return best ? formatShortDate(best) : null
}

function worstDay(entries) {
  const byDate = {}
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = new Set()
    byDate[e.date].add(e.metric)
  }
  // Find day with fewest entries (but at least 1)
  let worst = null
  let worstScore = Infinity
  for (const [date, metrics] of Object.entries(byDate)) {
    if (metrics.size < worstScore) {
      worstScore = metrics.size
      worst = date
    }
  }
  return worst ? formatShortDate(worst) : null
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function getStreak(entries) {
  // Exclude daily_note from streak calculation
  const numericEntries = entries.filter(e => e.metric !== 'daily_note')
  const dates = [...new Set(numericEntries.map(e => e.date))].sort().reverse()
  if (!dates.length) return 0
  let streak = 0
  let expected = getToday()
  for (const d of dates) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().split('T')[0]
    } else {
      break
    }
  }
  return streak
}

const currentEntries = computed(() => getEntriesInRange(currentRange.value.start, currentRange.value.end))
const previousEntries = computed(() => getEntriesInRange(previousRange.value.start, previousRange.value.end))

const currentByMetric = computed(() => groupByMetric(currentEntries.value))
const previousByMetric = computed(() => groupByMetric(previousEntries.value))

const metricStats = computed(() => {
  return enabledMetrics.value.map(m => {
    const curr = currentByMetric.value[m.id] || []
    const prev = previousByMetric.value[m.id] || []
    const currAvg = m.id === 'steps' ? Math.round(avg(curr)) : avg(curr)
    const prevAvg = m.id === 'steps' ? Math.round(avg(prev)) : avg(prev)
    const change = prevAvg > 0 ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : 0
    const daysTracked = curr.length
    const completionRate = Math.round((daysTracked / currentRange.value.days) * 100)
    return {
      ...m,
      currAvg,
      prevAvg,
      change,
      daysTracked,
      completionRate,
      currTotal: m.id === 'steps' ? sum(curr) : null,
    }
  })
})

const summaryStats = computed(() => {
  const entries = currentEntries.value
  const totalEntries = entries.length
  const daysTracked = new Set(entries.map(e => e.date)).size
  const completionRate = Math.round((daysTracked / currentRange.value.days) * 100)
  const streak = getStreak(entries)
  const best = bestDay(entries)
  const worst = worstDay(entries)
  return { totalEntries, daysTracked, completionRate, streak, best, worst }
})

const dayLabels = computed(() => {
  if (period.value === 'week') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(getDaysAgo(29 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
})

function getDailyAverages(metricId) {
  const entries = currentEntries.value.filter(e => e.metric === metricId)
  const byDate = {}
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e.value)
  }
  const dates = Object.keys(byDate).sort()
  return dates.map(d => ({ date: d, avg: avg(byDate[d]) }))
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top">
      <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">Summary</h1>
      <p class="text-[13px] text-gray-400 font-medium">Period overview and comparisons</p>
    </div>

    <!-- Period Toggle -->
    <div class="px-5 md:px-8 mt-5">
      <div class="bg-gray-100/80 rounded-xl p-1 flex">
        <button
          @click="period = 'week'"
          class="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
          :class="period === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
        >
          This Week
        </button>
        <button
          @click="period = 'month'"
          class="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200"
          :class="period === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
        >
          This Month
        </button>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="px-5 md:px-8 mt-4 grid grid-cols-2 gap-3">
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
        <div class="flex items-center gap-2 mb-2">
          <Flame :size="14" class="text-amber-500" />
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Streak</span>
        </div>
        <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ summaryStats.streak }}<span class="text-sm text-gray-400 ml-0.5">days</span></div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
        <div class="flex items-center gap-2 mb-2">
          <BarChart3 :size="14" class="text-primary" />
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completion</span>
        </div>
        <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ summaryStats.completionRate }}<span class="text-sm text-gray-400 ml-0.5">%</span></div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
        <div class="flex items-center gap-2 mb-2">
          <Trophy :size="14" class="text-emerald-500" />
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Best Day</span>
        </div>
        <div class="text-sm font-bold text-gray-900">{{ summaryStats.best || '--' }}</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80">
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle :size="14" class="text-amber-500" />
          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Needs Work</span>
        </div>
        <div class="text-sm font-bold text-gray-900">{{ summaryStats.worst || '--' }}</div>
      </div>
    </div>

    <!-- Metric Comparisons -->
    <div class="px-5 md:px-8 mt-5">
      <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        {{ period === 'week' ? 'Weekly' : 'Monthly' }} Averages
      </h2>
      <div class="space-y-2.5">
        <div
          v-for="stat in metricStats"
          :key="stat.id"
          class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                :style="{ background: `linear-gradient(135deg, ${stat.color}18, ${stat.color}08)` }"
              >
                <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: stat.color }" />
              </div>
              <div>
                <span class="font-semibold text-gray-900 text-[14px]">{{ stat.name }}</span>
                <span class="text-[11px] text-gray-400 block">{{ stat.daysTracked }}/{{ currentRange.days }} days logged</span>
              </div>
            </div>
            <div v-if="stat.change !== 0" class="flex items-center gap-1 text-[13px] font-bold"
              :class="stat.change > 0 ? 'text-emerald-600' : 'text-rose-500'"
            >
              <ArrowUpRight v-if="stat.change > 0" :size="14" />
              <ArrowDownRight v-else :size="14" />
              {{ Math.abs(stat.change) }}%
            </div>
            <Minus v-else :size="14" class="text-gray-300" />
          </div>

          <!-- Current vs Previous -->
          <div class="flex items-end gap-4">
            <div class="flex-1">
              <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Current</div>
              <div class="text-lg font-bold tabular-nums" :style="{ color: stat.color }">
                {{ formatMetricValue(stat.id, stat.currAvg) }}
              </div>
            </div>
            <div class="flex-1">
              <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Previous</div>
              <div class="text-lg font-bold tabular-nums text-gray-400">
                {{ stat.prevAvg > 0 ? formatMetricValue(stat.id, stat.prevAvg) : '--' }}
              </div>
            </div>
            <div v-if="stat.currTotal !== null" class="flex-1">
              <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total</div>
              <div class="text-lg font-bold tabular-nums text-gray-700">
                {{ formatMetricValue(stat.id, stat.currTotal) }}
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-3">
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :style="{
                  width: Math.min(100, stat.completionRate) + '%',
                  backgroundColor: stat.color,
                  opacity: 0.6,
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
