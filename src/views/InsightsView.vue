<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, TrendingUp, TrendingDown, Minus, BarChart3 } from '@lucide/vue'
import { useMetricsStore } from '../stores/metrics'
import { useSettingsStore } from '../stores/settings'
import { useInsights } from '../composables/useInsights'
import { metricNames, getAllMetrics } from '../data/defaultMetrics'
import CorrelationChart from '../components/CorrelationChart.vue'
import TrendLine from '../components/TrendLine.vue'
import InsightCard from '../components/InsightCard.vue'

const router = useRouter()
const metricsStore = useMetricsStore()
const settingsStore = useSettingsStore()
const { insights, correlations, trends, loading, computeInsights, getScatterData, getTrendData } = useInsights()

const allMetrics = computed(() =>
  getAllMetrics(settingsStore.settings.customMetrics)
)

const enabledMetrics = computed(() =>
  allMetrics.value.filter(m => settingsStore.settings.enabledMetrics.includes(m.id))
)

const selectedPair = ref(null)
const allEntries = ref([])

// Build metric names lookup including custom metrics
const allMetricNames = computed(() => {
  const names = { ...metricNames }
  for (const m of allMetrics.value) {
    if (!names[m.id]) names[m.id] = m.name
  }
  return names
})

const numericEntryCount = computed(() =>
  allEntries.value.filter(e => e.metric !== 'daily_note').length
)

const scatterData = computed(() => {
  if (!selectedPair.value || !allEntries.value.length) return { data: [], metricA: '', metricB: '' }
  const [a, b] = selectedPair.value.split('-')
  return {
    data: getScatterData(allEntries.value, a, b),
    metricA: a,
    metricB: b,
  }
})

onMounted(async () => {
  await settingsStore.loadSettings()
  allEntries.value = await metricsStore.getAllEntries()
  await computeInsights(settingsStore.settings.enabledMetrics)
})

function selectPair(metricA, metricB) {
  selectedPair.value = `${metricA}-${metricB}`
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top">
      <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">Insights</h1>
      <p class="text-[13px] text-gray-400 font-medium">Discover patterns in your data</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="px-5 md:px-8 mt-8">
      <div class="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <Sparkles :size="18" class="text-primary" />
        </div>
        <div>
          <div class="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div class="h-3 w-48 bg-gray-100 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- No Data -->
    <div v-if="!loading && numericEntryCount < 7" class="px-5 md:px-8 mt-12">
      <div class="text-center py-8">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 :size="28" class="text-gray-300" />
        </div>
        <p class="text-gray-500 font-semibold">Not enough data yet</p>
        <p class="text-gray-400 text-[13px] mt-1 max-w-[240px] mx-auto">Keep tracking for 7+ days to unlock personalized insights</p>
        <button
          @click="router.push('/tracker')"
          class="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/25 active:scale-95 transition-all"
        >
          Log Today
        </button>
      </div>
    </div>

    <!-- Insight Cards -->
    <div v-if="insights.length" class="px-5 md:px-8 mt-6">
      <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Did You Know?</h2>
      <div class="space-y-2.5">
        <InsightCard
          v-for="(insight, i) in insights"
          :key="i"
          :text="insight"
        />
      </div>
    </div>

    <!-- Correlation Pairs -->
    <div v-if="correlations.length" class="px-5 md:px-8 mt-6">
      <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Correlations</h2>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="pair in correlations"
          :key="`${pair.metricA}-${pair.metricB}`"
          @click="selectPair(pair.metricA, pair.metricB)"
          class="px-3.5 py-2 rounded-xl text-[13px] font-semibold border-2 transition-all duration-200 active:scale-95"
          :class="selectedPair === `${pair.metricA}-${pair.metricB}`
            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'"
        >
          {{ allMetricNames[pair.metricA] }} × {{ allMetricNames[pair.metricB] }}
          <span class="ml-1 text-[10px] opacity-60">r={{ pair.r }}</span>
        </button>
      </div>
    </div>

    <!-- Scatter Chart -->
    <div v-if="selectedPair" class="px-5 md:px-8 mt-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <h3 class="font-semibold text-gray-900 text-[15px] mb-3">
          {{ allMetricNames[scatterData.metricA] }} vs {{ allMetricNames[scatterData.metricB] }}
        </h3>
        <CorrelationChart
          :data="scatterData.data"
          :metric-a="scatterData.metricA"
          :metric-b="scatterData.metricB"
        />
      </div>
    </div>

    <!-- Trends -->
    <div class="px-5 md:px-8 mt-6">
      <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Trends</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="metric in enabledMetrics"
          :key="metric.id"
          class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div
                class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: metric.color }"
              />
              <span class="font-semibold text-gray-900 text-[13px]">{{ metric.name }}</span>
            </div>
            <div v-if="trends[metric.id]" class="flex items-center gap-1 text-[13px] font-bold"
              :class="{
                'text-success': trends[metric.id].direction === 'up',
                'text-warning': trends[metric.id].direction === 'down',
                'text-gray-300': trends[metric.id].direction === 'stable',
              }"
            >
              <TrendingUp v-if="trends[metric.id].direction === 'up'" :size="14" />
              <TrendingDown v-if="trends[metric.id].direction === 'down'" :size="14" />
              <Minus v-if="trends[metric.id].direction === 'stable'" :size="14" />
              <span v-if="trends[metric.id].change !== 0">
                {{ trends[metric.id].change > 0 ? '+' : '' }}{{ trends[metric.id].change }}%
              </span>
            </div>
          </div>
          <TrendLine
            :data="getTrendData(allEntries, metric.id)"
            :color="metric.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
