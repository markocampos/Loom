import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '../composables/useDatabase'

export const useSettingsStore = defineStore('settings', () => {
  const { run, query, isReady, initDatabase } = useDatabase()

  const _loaded = ref(false)

  const settings = ref({
    onboardingComplete: false,
    enabledMetrics: ['mood', 'sleep', 'coffee', 'steps', 'screen_time'],
    targets: {
      mood: 7,
      sleep: 8,
      coffee: 2,
      steps: 10000,
      screen_time: 4,
    },
    customMetrics: [],
  })

  async function loadSettings() {
    if (!isReady.value) await initDatabase()
    const rows = await query('SELECT * FROM settings')
    for (const row of rows) {
      try {
        settings.value[row.key] = JSON.parse(row.value)
      } catch {
        settings.value[row.key] = row.value
      }
    }
    _loaded.value = true
  }

  async function saveSetting(key, value) {
    if (!isReady.value) await initDatabase()
    settings.value[key] = value
    await run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    )
  }

  async function completeOnboarding() {
    await saveSetting('onboardingComplete', true)
  }

  async function setEnabledMetrics(metrics) {
    await saveSetting('enabledMetrics', metrics)
  }

  async function setTargets(targets) {
    await saveSetting('targets', targets)
  }

  async function setCustomMetrics(metrics) {
    await saveSetting('customMetrics', metrics)
  }

  async function addCustomMetric(metric) {
    const current = [...(settings.value.customMetrics || [])]
    current.push(metric)
    await setCustomMetrics(current)
  }

  async function removeCustomMetric(metricId) {
    const current = [...(settings.value.customMetrics || [])]
    const idx = current.findIndex(m => m.id === metricId)
    if (idx > -1) {
      current.splice(idx, 1)
      await setCustomMetrics(current)
    }
  }

  return {
    settings,
    _loaded,
    loadSettings,
    saveSetting,
    completeOnboarding,
    setEnabledMetrics,
    setTargets,
    setCustomMetrics,
    addCustomMetric,
    removeCustomMetric,
  }
})
