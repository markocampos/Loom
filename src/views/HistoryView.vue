<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import { useMetricsStore } from '../stores/metrics'
import { useSettingsStore } from '../stores/settings'
import { getAllMetrics } from '../data/defaultMetrics'
import { formatDate, formatMetricValue } from '../utils/formatters'

const metricsStore = useMetricsStore()
const settingsStore = useSettingsStore()

const currentDate = ref(new Date())
const selectedDay = ref(null)
const dayEntries = ref([])

const allMetrics = computed(() =>
  getAllMetrics(settingsStore.settings.customMetrics)
)

const enabledMetrics = computed(() =>
  allMetrics.value.filter(m => settingsStore.settings.enabledMetrics.includes(m.id))
)

const monthLabel = computed(() =>
  currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null, entries: 0 })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({
      date: formatDate(new Date(year, month, d)),
      day: d,
      entries: 0,
      isToday: formatDate(new Date(year, month, d)) === formatDate(new Date()),
    })
  }

  return days
})

const monthDates = computed(() =>
  calendarDays.value.filter(d => d.date).map(d => d.date)
)

onMounted(async () => {
  await settingsStore.loadSettings()
  await loadMonth()
})

async function loadMonth() {
  for (const day of calendarDays.value) {
    if (!day.date) continue
    const entries = await metricsStore.getEntriesForDate(day.date)
    day.entries = entries.length
  }
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadMonth()
  selectedDay.value = null
  dayEntries.value = []
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadMonth()
  selectedDay.value = null
  dayEntries.value = []
}

async function selectDay(date) {
  if (!date) return
  selectedDay.value = selectedDay.value === date ? null : date
  if (selectedDay.value) {
    dayEntries.value = await metricsStore.getEntriesForDate(date)
  } else {
    dayEntries.value = []
  }
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top">
      <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">History</h1>
    </div>

    <!-- Calendar -->
    <div class="px-5 md:px-8 mt-5">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <!-- Month Nav -->
        <div class="flex justify-between items-center mb-5">
          <button @click="prevMonth" class="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-95 transition-all">
            <ChevronLeft :size="18" />
          </button>
          <span class="font-semibold text-gray-900 text-[15px]">{{ monthLabel }}</span>
          <button @click="nextMonth" class="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-95 transition-all">
            <ChevronRight :size="18" />
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div v-for="day in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="day" class="text-center text-[10px] text-gray-300 font-bold uppercase tracking-wider">
            {{ day }}
          </div>
        </div>

        <!-- Days -->
        <div class="grid grid-cols-7 gap-1">
          <div v-for="(day, i) in calendarDays" :key="i" class="aspect-square">
            <button
              v-if="day.date"
              @click="selectDay(day.date)"
              class="w-full h-full rounded-xl flex flex-col items-center justify-center transition-all duration-200 text-sm relative"
              :class="{
                'bg-primary text-white shadow-md shadow-primary/20 scale-105': selectedDay === day.date,
                'bg-success/10 text-success': day.entries >= enabledMetrics.length && selectedDay !== day.date,
                'bg-amber-50 text-amber-600': day.entries > 0 && day.entries < enabledMetrics.length && selectedDay !== day.date,
                'text-gray-700 hover:bg-gray-50': day.entries === 0 && selectedDay !== day.date,
              }"
            >
              <span class="font-semibold text-[13px]" :class="{ 'ring-2 ring-primary/30 rounded-full w-7 h-7 flex items-center justify-center': day.isToday && selectedDay !== day.date }">
                {{ day.day }}
              </span>
              <div v-if="day.entries > 0 && selectedDay !== day.date" class="flex gap-0.5 mt-0.5">
                <div
                  v-for="n in Math.min(day.entries, 5)"
                  :key="n"
                  class="w-1 h-1 rounded-full"
                  :class="day.entries >= enabledMetrics.length ? 'bg-success' : 'bg-amber-400'"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Day Details -->
    <Transition name="slide-up">
      <div v-if="selectedDay && dayEntries.length" class="px-5 md:px-8 mt-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
          <div class="flex items-center gap-2 mb-4">
            <Calendar :size="16" class="text-primary" />
            <h3 class="font-semibold text-gray-900 text-[15px]">{{ selectedDay }}</h3>
          </div>
          <div class="space-y-1">
            <div
              v-for="entry in dayEntries"
              :key="entry.metric"
              class="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50/80 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-2.5 h-2.5 rounded-full"
                  :style="{ backgroundColor: (enabledMetrics.find(m => m.id === entry.metric) || {}).color || '#999' }"
                />
                <span class="text-[13px] text-gray-600 font-medium">
                  {{ (enabledMetrics.find(m => m.id === entry.metric) || {}).name || entry.metric }}
                </span>
              </div>
              <span class="text-[13px] font-bold text-gray-900 tabular-nums">
                {{ formatMetricValue(entry.metric, entry.value) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
.slide-up-leave-to { opacity: 0; transform: translateY(12px); }
</style>
