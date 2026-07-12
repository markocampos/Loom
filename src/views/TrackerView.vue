<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, Download, Loader2 } from '@lucide/vue'
import { useMetricsStore } from '../stores/metrics'
import { useSettingsStore } from '../stores/settings'
import { useHealthData } from '../composables/useHealthData'
import { getAllMetrics } from '../data/defaultMetrics'
import { getToday } from '../utils/formatters'
import MoodPicker from '../components/MoodPicker.vue'
import SleepPicker from '../components/SleepPicker.vue'
import NumberInput from '../components/NumberInput.vue'

const router = useRouter()
const metricsStore = useMetricsStore()
const settingsStore = useSettingsStore()
const health = useHealthData()

const selectedDate = ref(getToday())
const dayData = ref({})
const dayNotes = ref('')
const saving = ref(false)
const saved = ref(false)
const healthAvailable = ref(false)
const importing = ref(false)

const allMetrics = computed(() =>
  getAllMetrics(settingsStore.settings.customMetrics)
)

const enabledMetrics = computed(() =>
  allMetrics.value.filter(m => settingsStore.settings.enabledMetrics.includes(m.id))
)

onMounted(async () => {
  await settingsStore.loadSettings()
  const entries = await metricsStore.getEntriesForDate(selectedDate.value)
  for (const e of entries) {
    if (e.metric === 'daily_note') {
      dayNotes.value = e.value || ''
    } else {
      dayData.value[e.metric] = e.value
    }
  }
  healthAvailable.value = await health.checkAvailability()
})

function getPresets(metricId) {
  const presetMap = {
    coffee: [1, 2, 3, 4],
    steps: [3000, 5000, 7500, 10000],
    screen_time: [1, 2, 4, 6, 8],
  }
  return presetMap[metricId] || []
}

async function importFromHealth() {
  importing.value = true
  try {
    if (healthAvailable.value) {
      const granted = await health.requestPermissions()
      if (granted) {
        const data = await health.importTodayData()
        if (data.steps) dayData.value.steps = data.steps
        if (data.sleep) dayData.value.sleep = data.sleep
      }
    }
  } finally {
    importing.value = false
  }
}

async function saveDay() {
  saving.value = true
  try {
    await metricsStore.saveDay(selectedDate.value, dayData.value)
    // Save daily note
    if (dayNotes.value.trim()) {
      await metricsStore.saveEntry(selectedDate.value, 'daily_note', dayNotes.value.trim())
    } else {
      await metricsStore.deleteEntry(selectedDate.value, 'daily_note')
    }
    saved.value = true
    setTimeout(() => router.push('/'), 600)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top">
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
        >
          <ArrowLeft :size="20" />
        </button>
        <div class="flex-1">
          <h1 class="text-xl font-bold text-gray-900">Log Your Day</h1>
          <p class="text-[13px] text-gray-400 font-medium">{{ selectedDate }}</p>
        </div>
        <!-- Auto-import button -->
        <button
          v-if="healthAvailable"
          @click="importFromHealth"
          :disabled="importing"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-[13px] font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          <Loader2 v-if="importing" :size="14" class="animate-spin" />
          <Download v-else :size="14" />
          {{ importing ? 'Importing...' : 'Auto-import' }}
        </button>
      </div>
    </div>

    <!-- Success overlay -->
    <Transition name="fade">
      <div v-if="saved" class="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
        <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <Check :size="32" class="text-success" />
        </div>
        <p class="text-lg font-bold text-gray-900">Saved!</p>
      </div>
    </Transition>

    <!-- Health integration hint -->
    <div v-if="!healthAvailable" class="px-5 md:px-8 mt-4">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50">
        <p class="text-[12px] text-blue-600 font-medium">
          Tip: Enable Health Connect to auto-import your daily steps.
        </p>
      </div>
    </div>

    <!-- Metrics -->
    <div class="px-5 md:px-8 mt-4 space-y-3">
      <div v-for="metric in enabledMetrics" :key="metric.id" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <!-- Built-in mood picker -->
        <MoodPicker v-if="metric.id === 'mood'" v-model="dayData.mood" />
        <!-- Built-in sleep picker -->
        <SleepPicker v-else-if="metric.id === 'sleep'" v-model="dayData.sleep" />
        <!-- All number-based metrics (built-in + custom) -->
        <NumberInput
          v-else
          v-model="dayData[metric.id]"
          :label="metric.name"
          :icon="metric.icon"
          :color="metric.color"
          :unit="metric.unit"
          :min="metric.min"
          :max="metric.max"
          :step="metric.step"
          :presets="metric.isCustom ? [] : getPresets(metric.id)"
        />
      </div>
    </div>

    <!-- Daily Note -->
    <div class="px-5 md:px-8 mt-4">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80">
        <div class="flex items-center gap-2.5 mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <span class="text-lg">📝</span>
          </div>
          <div class="flex-1">
            <span class="font-semibold text-gray-900 text-[15px]">Daily Note</span>
            <span class="text-[11px] text-gray-400 block">How was your day? (optional)</span>
          </div>
        </div>
        <textarea
          v-model="dayNotes"
          placeholder="Write about your day..."
          rows="3"
          class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-700 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 resize-none placeholder:text-gray-300"
        />
      </div>
    </div>

    <!-- Save Button -->
    <div class="px-5 md:px-8 mt-6">
      <button
        @click="saveDay"
        :disabled="saving || saved"
        class="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 shadow-lg"
        :class="saved
          ? 'bg-success shadow-success/25'
          : 'bg-gradient-to-r from-primary to-primary-dark shadow-primary/25'"
      >
        <Check :size="20" />
        {{ saved ? 'Saved!' : saving ? 'Saving...' : 'Save Day' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
