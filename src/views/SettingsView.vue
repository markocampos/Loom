<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Download, Upload, Sparkles, Target, Trash2, AlertTriangle,
  CheckCircle, Plus, Bell, MessageSquare
} from 'lucide-vue-next'
import { useSettingsStore } from '../stores/settings'
import { useMetricsStore } from '../stores/metrics'
import { useDatabase } from '../composables/useDatabase'
import { useNotifications } from '../composables/useNotifications'
import { defaultMetrics, customColors } from '../data/defaultMetrics'

const settingsStore = useSettingsStore()
const metricsStore = useMetricsStore()
const { exportAll, importData, clearAll } = useDatabase()
const notifications = useNotifications()

const targets = ref({})
const showClearConfirm = ref(false)
const clearConfirmText = ref('')
const importMessage = ref(null)

// Notification settings
const reminderEnabled = ref(false)
const reminderTime = ref('18:00')
const weeklySummaryEnabled = ref(false)
let reminderTimer = null

onUnmounted(() => {
  if (reminderTimer) clearTimeout(reminderTimer)
})

// Custom metrics
const showAddMetric = ref(false)
const newMetric = ref({
  name: '',
  unit: '',
  min: 0,
  max: 100,
  step: 1,
  icon: 'Heart',
  color: '#8B5CF6',
  description: '',
})

const customMetrics = computed(() => settingsStore.settings.customMetrics || [])

onMounted(async () => {
  await settingsStore.loadSettings()
  targets.value = { ...settingsStore.settings.targets }
  reminderEnabled.value = settingsStore.settings.reminderEnabled || false
  reminderTime.value = settingsStore.settings.reminderTime || '18:00'
  weeklySummaryEnabled.value = settingsStore.settings.weeklySummaryEnabled || false
})

async function addCustomMetric() {
  if (!newMetric.value.name.trim()) return
  const id = 'custom_' + Date.now()
  const metric = {
    ...newMetric.value,
    id,
    name: newMetric.value.name.trim(),
  }
  await settingsStore.addCustomMetric(metric)
  // Auto-enable the new metric
  const enabled = [...settingsStore.settings.enabledMetrics, id]
  await settingsStore.setEnabledMetrics(enabled)
  // Reset form
  newMetric.value = { name: '', unit: '', min: 0, max: 100, step: 1, icon: 'Heart', color: '#8B5CF6', description: '' }
  showAddMetric.value = false
}

async function removeCustomMetric(metricId) {
  await settingsStore.removeCustomMetric(metricId)
  // Also disable it
  const enabled = settingsStore.settings.enabledMetrics.filter(id => id !== metricId)
  await settingsStore.setEnabledMetrics(enabled)
}

function toggleMetric(metricId) {
  const current = [...settingsStore.settings.enabledMetrics]
  const idx = current.indexOf(metricId)
  if (idx > -1) {
    if (current.length <= 1) return
    current.splice(idx, 1)
  } else {
    current.push(metricId)
  }
  settingsStore.setEnabledMetrics(current)
}

async function saveTargets() {
  await settingsStore.setTargets(targets.value)
}

// CSV Export
function exportCSV() {
  metricsStore.getAllEntries().then(entries => {
    const csv = ['date,metric,value,note']
    entries.forEach(e => {
      csv.push(`${e.date},${e.metric},${e.value},"${(e.note || '').replace(/"/g, '""')}"`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loom-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  })
}

// CSV Import
function importCSV() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const header = lines[0].toLowerCase()

      if (!header.includes('date') || !header.includes('metric')) {
        showImportError('Invalid CSV format. Expected columns: date, metric, value, note')
        return
      }

      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].match(/(".*?"|[^,]+)/g)
        if (!parts || parts.length < 3) continue

        const date = parts[0].replace(/"/g, '').trim()
        const metric = parts[1].replace(/"/g, '').trim()
        const value = parseFloat(parts[2].replace(/"/g, '').trim())
        const note = parts[3]?.replace(/"/g, '').trim() || null

        if (date && metric && !isNaN(value)) {
          await metricsStore.saveEntry(date, metric, value, note)
          imported++
        }
      }

      showImportSuccess(`Imported ${imported} entries from CSV`)
    } catch (err) {
      showImportError('Failed to parse CSV file')
    }
  }
  input.click()
}

// Full Backup (JSON)
function exportBackup() {
  exportAll().then(data => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loom-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  })
}

// Restore Backup
function restoreBackup() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.data || !backup.data.entries) {
        showImportError('Invalid backup file format')
        return
      }

      await importData(backup.data)
      await settingsStore.loadSettings()
      targets.value = { ...settingsStore.settings.targets }

      showImportSuccess(`Restored ${backup.data.entries.length} entries from backup`)
    } catch (err) {
      showImportError('Failed to parse backup file')
    }
  }
  input.click()
}

// Clear All Data
async function clearAllData() {
  await clearAll()
  showClearConfirm.value = false
  clearConfirmText.value = ''
  showImportSuccess('All data cleared')
  await settingsStore.loadSettings()
  targets.value = { ...settingsStore.settings.targets }
}

function showImportSuccess(msg) {
  importMessage.value = { type: 'success', text: msg }
  setTimeout(() => { importMessage.value = null }, 3000)
}

function showImportError(msg) {
  importMessage.value = { type: 'error', text: msg }
  setTimeout(() => { importMessage.value = null }, 4000)
}

// Notification settings
async function toggleReminder() {
  if (!reminderEnabled.value) {
    const granted = await notifications.requestPermission()
    if (!granted) {
      showImportError('Notification permission denied. Please enable in browser settings.')
      reminderEnabled.value = false
      return
    }
    reminderEnabled.value = true
    const [h, m] = reminderTime.value.split(':').map(Number)
    reminderTimer = notifications.scheduleReminder(h, m, "Time to log your day! Don't break your streak.")
    showImportSuccess('Daily reminder set for ' + reminderTime.value)
  } else {
    reminderEnabled.value = false
    if (reminderTimer) clearTimeout(reminderTimer)
    reminderTimer = null
  }
  await settingsStore.saveSetting('reminderEnabled', reminderEnabled.value)
  await settingsStore.saveSetting('reminderTime', reminderTime.value)
}

async function updateReminderTime() {
  if (reminderEnabled.value) {
    if (reminderTimer) clearTimeout(reminderTimer)
    const [h, m] = reminderTime.value.split(':').map(Number)
    reminderTimer = notifications.scheduleReminder(h, m, "Time to log your day! Don't break your streak.")
  }
  await settingsStore.saveSetting('reminderTime', reminderTime.value)
}

async function toggleWeeklySummary() {
  if (!weeklySummaryEnabled.value) {
    const granted = await notifications.requestPermission()
    if (!granted) {
      showImportError('Notification permission denied. Please enable in browser settings.')
      weeklySummaryEnabled.value = false
      return
    }
    weeklySummaryEnabled.value = true
  } else {
    weeklySummaryEnabled.value = false
  }
  await settingsStore.saveSetting('weeklySummaryEnabled', weeklySummaryEnabled.value)
}

function sendTestNotification() {
  notifications.showNotification('Loom', 'This is a test notification!', {
    tag: 'loom-test',
  })
}
</script>

<template>
  <div class="min-h-screen bg-background pb-28 md:pb-8">
    <!-- Header -->
    <div class="px-5 md:px-8 pt-12 safe-top">
      <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">Settings</h1>
    </div>

    <!-- Import/Export Message -->
    <Transition name="fade">
      <div v-if="importMessage" class="px-5 md:px-8 mt-4">
        <div
          class="rounded-2xl p-4 flex items-center gap-3"
          :class="importMessage.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200/50'
            : 'bg-rose-50 border border-rose-200/50'"
        >
          <CheckCircle v-if="importMessage.type === 'success'" :size="18" class="text-emerald-600" />
          <AlertTriangle v-else :size="18" class="text-rose-600" />
          <span class="text-[13px] font-medium"
            :class="importMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'"
          >{{ importMessage.text }}</span>
        </div>
      </div>
    </Transition>

    <!-- Metrics Toggle -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <Sparkles :size="14" class="text-primary" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Metrics</h2>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div
          v-for="(metric, i) in defaultMetrics"
          :key="metric.id"
          class="flex items-center justify-between p-4 transition-colors"
          :class="i < defaultMetrics.length - 1 ? 'border-b border-gray-50' : ''"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: metric.color + '12' }"
            >
              <div class="text-sm font-bold" :style="{ color: metric.color }">{{ metric.name[0] }}</div>
            </div>
            <div>
              <span class="font-semibold text-gray-900 text-[15px]">{{ metric.name }}</span>
              <span class="text-[11px] text-gray-400 block">{{ metric.description }}</span>
            </div>
          </div>
          <button
            @click="toggleMetric(metric.id)"
            class="p-1 active:scale-95 transition-transform"
          >
            <div
              class="w-12 h-7 rounded-full flex items-center transition-all duration-200 p-0.5"
              :class="settingsStore.settings.enabledMetrics.includes(metric.id)
                ? 'bg-primary justify-end'
                : 'bg-gray-200 justify-start'"
            >
              <div class="w-6 h-6 bg-white rounded-full shadow-sm transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Metrics -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Plus :size="14" class="text-emerald-500" />
          <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Custom Metrics</h2>
        </div>
        <button
          @click="showAddMetric = !showAddMetric"
          class="text-[12px] font-semibold text-primary flex items-center gap-1 active:scale-95 transition-all"
        >
          <Plus :size="14" />
          {{ showAddMetric ? 'Cancel' : 'Add' }}
        </button>
      </div>

      <!-- Add Metric Form -->
      <Transition name="slide">
        <div v-if="showAddMetric" class="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 mb-3">
          <div class="space-y-4">
            <div>
              <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Name</label>
              <input
                v-model="newMetric.name"
                type="text"
                placeholder="e.g., Water, Exercise, Reading"
                class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Unit</label>
                <input
                  v-model="newMetric.unit"
                  type="text"
                  placeholder="e.g., ml, min, pages"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
              <div>
                <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Step</label>
                <input
                  v-model.number="newMetric.step"
                  type="number"
                  min="0.1"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Min</label>
                <input
                  v-model.number="newMetric.min"
                  type="number"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
              <div>
                <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Max</label>
                <input
                  v-model.number="newMetric.max"
                  type="number"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              </div>
            </div>
            <!-- Color picker -->
            <div>
              <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Color</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="color in customColors"
                  :key="color"
                  @click="newMetric.color = color"
                  class="w-8 h-8 rounded-full transition-all duration-200"
                  :class="newMetric.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'"
                  :style="{ backgroundColor: color }"
                />
              </div>
            </div>
            <!-- Description -->
            <div>
              <label class="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Description</label>
              <input
                v-model="newMetric.description"
                type="text"
                placeholder="What do you want to track?"
                class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <button
              @click="addCustomMetric"
              :disabled="!newMetric.name.trim()"
              class="w-full py-3 rounded-xl bg-primary text-white font-semibold text-[14px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Metric
            </button>
          </div>
        </div>
      </Transition>

      <!-- Custom Metrics List -->
      <div v-if="customMetrics.length" class="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div
          v-for="(metric, i) in customMetrics"
          :key="metric.id"
          class="flex items-center justify-between p-4 transition-colors"
          :class="i < customMetrics.length - 1 ? 'border-b border-gray-50' : ''"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: metric.color + '12' }"
            >
              <div class="text-sm font-bold" :style="{ color: metric.color }">{{ metric.name[0] }}</div>
            </div>
            <div>
              <span class="font-semibold text-gray-900 text-[15px]">{{ metric.name }}</span>
              <span class="text-[11px] text-gray-400 block">{{ metric.unit || 'custom' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="toggleMetric(metric.id)"
              class="p-1 active:scale-95 transition-transform"
            >
              <div
                class="w-12 h-7 rounded-full flex items-center transition-all duration-200 p-0.5"
                :class="settingsStore.settings.enabledMetrics.includes(metric.id)
                  ? 'bg-primary justify-end'
                  : 'bg-gray-200 justify-start'"
              >
                <div class="w-6 h-6 bg-white rounded-full shadow-sm transition-transform" />
              </div>
            </button>
            <button
              @click="removeCustomMetric(metric.id)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition-all"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 text-center">
        <p class="text-[13px] text-gray-400">No custom metrics yet. Tap "Add" to create one.</p>
      </div>
    </div>

    <!-- Targets -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <Target :size="14" class="text-accent" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Daily Targets</h2>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div
          v-for="(metric, i) in defaultMetrics"
          :key="metric.id"
          class="flex items-center justify-between p-4"
          :class="i < defaultMetrics.length - 1 ? 'border-b border-gray-50' : ''"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: metric.color }"
            />
            <span class="font-medium text-gray-900 text-[15px]">{{ metric.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="targets[metric.id]"
              type="number"
              :min="metric.min"
              :max="metric.max"
              :step="metric.step"
              class="w-20 text-right px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all tabular-nums"
              @change="saveTargets"
            />
            <span class="text-[11px] text-gray-400 font-medium w-8">{{ metric.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <Bell :size="14" class="text-violet-500" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reminders</h2>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <!-- Daily Reminder -->
        <div class="p-4 border-b border-gray-50">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-semibold text-gray-900 text-[15px]">Daily Reminder</span>
              <span class="text-[11px] text-gray-400 block">Get reminded to log your metrics</span>
            </div>
            <button
              @click="toggleReminder"
              class="p-1 active:scale-95 transition-transform"
            >
              <div
                class="w-12 h-7 rounded-full flex items-center transition-all duration-200 p-0.5"
                :class="reminderEnabled
                  ? 'bg-violet-500 justify-end'
                  : 'bg-gray-200 justify-start'"
              >
                <div class="w-6 h-6 bg-white rounded-full shadow-sm transition-transform" />
              </div>
            </button>
          </div>
          <div v-if="reminderEnabled" class="mt-3 flex items-center gap-3">
            <input
              v-model="reminderTime"
              type="time"
              class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200/80 text-sm font-semibold text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
              @change="updateReminderTime"
            />
            <button
              @click="sendTestNotification"
              class="px-3 py-2.5 rounded-xl bg-violet-50 text-violet-600 text-[12px] font-semibold active:scale-95 transition-all"
            >
              Test
            </button>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-semibold text-gray-900 text-[15px]">Weekly Summary</span>
              <span class="text-[11px] text-gray-400 block">Get a weekly progress notification</span>
            </div>
            <button
              @click="toggleWeeklySummary"
              class="p-1 active:scale-95 transition-transform"
            >
              <div
                class="w-12 h-7 rounded-full flex items-center transition-all duration-200 p-0.5"
                :class="weeklySummaryEnabled
                  ? 'bg-violet-500 justify-end'
                  : 'bg-gray-200 justify-start'"
              >
                <div class="w-6 h-6 bg-white rounded-full shadow-sm transition-transform" />
              </div>
            </button>
          </div>
          <p v-if="weeklySummaryEnabled" class="text-[11px] text-gray-400 mt-2">
            You'll receive a summary every Sunday evening
          </p>
        </div>

        <!-- Permission notice -->
        <div v-if="!notifications.isSupported.value" class="px-4 pb-4">
          <div class="bg-gray-50 rounded-xl p-3">
            <p class="text-[11px] text-gray-400">
              Notifications require a modern browser or the Loom app.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <Download :size="14" class="text-gray-400" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Data</h2>
      </div>
      <div class="space-y-2">
        <!-- Export CSV -->
        <button
          @click="exportCSV"
          class="w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Download :size="18" class="text-primary" />
          </div>
          <div class="text-left">
            <span class="font-semibold text-gray-900 text-[15px] block">Export as CSV</span>
            <span class="text-[11px] text-gray-400">Spreadsheet-friendly format</span>
          </div>
        </button>

        <!-- Import CSV -->
        <button
          @click="importCSV"
          class="w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Upload :size="18" class="text-emerald-600" />
          </div>
          <div class="text-left">
            <span class="font-semibold text-gray-900 text-[15px] block">Import CSV</span>
            <span class="text-[11px] text-gray-400">Import from spreadsheet (date, metric, value, note)</span>
          </div>
        </button>

        <!-- Full Backup -->
        <button
          @click="exportBackup"
          class="w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Download :size="18" class="text-blue-600" />
          </div>
          <div class="text-left">
            <span class="font-semibold text-gray-900 text-[15px] block">Full Backup</span>
            <span class="text-[11px] text-gray-400">Complete backup with all data + settings</span>
          </div>
        </button>

        <!-- Restore Backup -->
        <button
          @click="restoreBackup"
          class="w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all"
        >
          <div class="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Upload :size="18" class="text-violet-600" />
          </div>
          <div class="text-left">
            <span class="font-semibold text-gray-900 text-[15px] block">Restore Backup</span>
            <span class="text-[11px] text-gray-400">Restore from a Loom backup file</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <AlertTriangle :size="14" class="text-rose-500" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Danger Zone</h2>
      </div>
      <button
        @click="showClearConfirm = true; clearConfirmText = ''"
        class="w-full bg-white rounded-2xl shadow-sm border border-rose-200/50 p-4 flex items-center gap-3 hover:bg-rose-50/50 active:scale-[0.99] transition-all"
      >
        <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <Trash2 :size="18" class="text-rose-600" />
        </div>
        <div class="text-left">
          <span class="font-semibold text-rose-600 text-[15px] block">Clear All Data</span>
          <span class="text-[11px] text-gray-400">Permanently delete all entries and settings</span>
        </div>
      </button>
    </div>

    <!-- Clear Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showClearConfirm" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <div class="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle :size="24" class="text-rose-600" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 text-center">Clear All Data?</h3>
          <p class="text-[13px] text-gray-500 text-center mt-2">This will permanently delete all your entries and settings. This cannot be undone.</p>
          <div class="mt-4">
            <p class="text-[12px] text-gray-700 font-bold mb-1.5 text-center">Type "DELETE" to confirm:</p>
            <input
              v-model="clearConfirmText"
              type="text"
              placeholder="DELETE"
              class="w-full px-4 py-3 rounded-xl border border-gray-200/80 text-[14px] text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all text-center"
            />
          </div>
          <div class="flex gap-3 mt-6">
            <button
              @click="showClearConfirm = false; clearConfirmText = ''"
              class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-[14px] active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              @click="clearAllData"
              :disabled="clearConfirmText !== 'DELETE'"
              class="flex-1 py-3 rounded-xl bg-rose-600 text-white font-semibold text-[14px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Support & Feedback -->
    <div class="px-5 md:px-8 mt-6">
      <div class="flex items-center gap-2 mb-3">
        <MessageSquare :size="14" class="text-blue-500" />
        <h2 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Feedback</h2>
      </div>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLScbMQRB5fbpN3rn1Qu9D8oiHdjkJYsAizUBEkQDhcdrN27CXw/viewform?usp=header"
        target="_blank"
        rel="noopener noreferrer"
        class="w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.99] transition-all"
      >
        <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <MessageSquare :size="18" class="text-blue-600" />
        </div>
        <div class="text-left">
          <span class="font-semibold text-gray-900 text-[15px] block">Submit Feedback</span>
          <span class="text-[11px] text-gray-400">Share suggestions or report bugs</span>
        </div>
      </a>
    </div>

    <!-- App Info -->
    <div class="px-5 md:px-8 mt-8 mb-4">
      <div class="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 text-center border border-gray-100/50">
        <img src="/loom.png" alt="Loom" class="w-16 h-16 mx-auto mb-3 object-contain" />
        <p class="text-sm font-bold text-gray-900">Loom</p>
        <p class="text-[11px] text-gray-400 mt-0.5">v1.0.0 — Weave your data into insight</p>
      </div>
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
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
  max-height: 0;
}
.slide-enter-to, .slide-leave-from {
  max-height: 600px;
}
</style>
