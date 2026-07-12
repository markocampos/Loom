<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Flame, ArrowRight, Sparkles } from '@lucide/vue'
import { useMetricsStore } from '../stores/metrics'
import { useSettingsStore } from '../stores/settings'
import { getAllMetrics } from '../data/defaultMetrics'
import { getToday, getWeekDates, formatDisplayDate, parseDate } from '../utils/formatters'
import MetricCard from '../components/MetricCard.vue'

const router = useRouter()
const metricsStore = useMetricsStore()
const settingsStore = useSettingsStore()

const todayEntries = ref({})
const streak = ref(0)
const weekData = ref([])

const allMetrics = computed(() =>
  getAllMetrics(settingsStore.settings.customMetrics)
)

const enabledMetrics = computed(() =>
  allMetrics.value.filter(m => settingsStore.settings.enabledMetrics.includes(m.id))
)

onMounted(async () => {
  await settingsStore.loadSettings()
  await loadDashboard()
})

async function loadDashboard() {
  const today = getToday()
  const entries = await metricsStore.getEntriesForDate(today)
  todayEntries.value = {}
  for (const e of entries) {
    todayEntries.value[e.metric] = e.value
  }
  streak.value = await metricsStore.getStreak()

  const weekDates = getWeekDates()
  const allEntries = []
  for (const date of weekDates) {
    const dayEntries = await metricsStore.getEntriesForDate(date)
    allEntries.push({ date, entries: dayEntries })
  }
  weekData.value = allEntries
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top animate-fade-in">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-2.5 mb-0.5">
            <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">Today</h1>
            <Transition name="pop">
              <div
                v-if="streak > 0"
                class="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100/80 shadow-sm shadow-amber-100/50"
              >
                <Flame :size="13" class="fill-amber-400" />
                <span class="text-xs font-bold tabular-nums">{{ streak }}d</span>
              </div>
            </Transition>
          </div>
          <p class="text-[13px] text-gray-400 font-medium">{{ formatDisplayDate(new Date()) }}</p>
        </div>
        <button
          @click="router.push('/tracker')"
          class="w-11 h-11 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-90 transition-all duration-200"
        >
          <Plus :size="22" />
        </button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="px-5 md:px-8 mt-6">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          v-for="(metric, i) in enabledMetrics"
          :key="metric.id"
          :metric-id="metric.id"
          :name="metric.name"
          :icon="metric.icon"
          :color="metric.color"
          :value="todayEntries[metric.id]"
          :unit="metric.unit"
          :index="i"
        />
      </div>
    </div>

    <!-- Weekly Overview -->
    <div class="px-5 md:px-8 mt-5 animate-fade-in stagger-3">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 card-hover">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-gray-900 text-[15px]">This Week</h2>
          <button
            @click="router.push('/insights')"
            class="text-primary text-[13px] font-semibold flex items-center gap-1 hover:gap-1.5 transition-all duration-200"
          >
            Details <ArrowRight :size="13" />
          </button>
        </div>
        <div class="flex gap-1.5">
          <div
            v-for="(day, i) in weekData"
            :key="day.date"
            class="flex-1 text-center group"
          >
            <div class="text-[10px] text-gray-400 font-medium mb-2">
              {{ ['S','M','T','W','T','F','S'][parseDate(day.date).getDay()] }}
            </div>
            <div class="h-20 rounded-xl mx-auto w-full flex items-end justify-center gap-[3px] bg-gray-50/60 p-1.5 group-hover:bg-gray-100/60 transition-colors">
              <div
                v-for="metric in enabledMetrics.slice(0, 3)"
                :key="metric.id"
                class="w-[5px] rounded-full transition-all duration-500 ease-out"
                :style="{
                  backgroundColor: metric.color,
                  height: day.entries.find(e => e.metric === metric.id)
                    ? Math.max(8, Math.min(100, (day.entries.find(e => e.metric === metric.id).value / (metric.max || 10)) * 100)) + '%'
                    : '3px',
                  opacity: day.entries.find(e => e.metric === metric.id) ? 0.85 : 0.15,
                }"
              />
            </div>
            <div
              class="text-[10px] font-bold mt-1.5"
              :class="i === 6 ? 'text-primary' : 'text-gray-300'"
            >
              {{ ['S','M','T','W','T','F','S'][parseDate(day.date).getDay()] }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!weekData.some(d => d.entries.length > 0)" class="px-5 md:px-8 mt-5 animate-fade-in stagger-4">
      <div class="bg-gradient-to-br from-primary/[0.06] via-indigo-50/40 to-purple-50/30 rounded-2xl p-5 border border-primary/10 relative overflow-hidden">
        <div class="absolute inset-0 opacity-[0.02] pointer-events-none"
          style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 24px 24px;"
        />
        <div class="relative flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 shadow-sm shadow-primary/10">
            <Sparkles :size="18" class="text-primary" />
          </div>
          <div>
            <p class="text-[13px] font-semibold text-gray-900">Start your streak</p>
            <p class="text-[12px] text-gray-500 mt-0.5 leading-relaxed">Log today's metrics to begin tracking your progress.</p>
            <button
              @click="router.push('/tracker')"
              class="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-semibold shadow-md shadow-primary/20 active:scale-95 transition-all"
            >
              Log Now
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pop-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.8); }
.pop-leave-to { opacity: 0; transform: scale(0.8); }
</style>
