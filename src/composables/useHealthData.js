import { ref } from 'vue'

const isAvailable = ref(false)
const isLoading = ref(false)
const lastError = ref(null)

export function useHealthData() {
  async function checkAvailability() {
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform()) {
        isAvailable.value = false
        return false
      }

      try {
        const { HealthConnect } = await import('capacitor-health-connect')
        const result = await HealthConnect.checkAvailability()
        isAvailable.value = result?.status === 'Available'
        return isAvailable.value
      } catch {
        isAvailable.value = false
        return false
      }
    } catch {
      isAvailable.value = false
      return false
    }
  }

  async function requestPermissions() {
    try {
      const { HealthConnect } = await import('capacitor-health-connect')
      const result = await HealthConnect.requestHealthPermissions({
        read: ['Steps'],
        write: ['Steps'],
      })
      return result?.granted?.length > 0
    } catch (e) {
      lastError.value = 'Could not request health permissions'
      return false
    }
  }

  async function checkPermissions() {
    try {
      const { HealthConnect } = await import('capacitor-health-connect')
      const result = await HealthConnect.checkHealthPermissions({
        read: ['Steps'],
        write: ['Steps'],
      })
      return result?.granted?.length > 0
    } catch {
      return false
    }
  }

  async function getSteps(date) {
    isLoading.value = true
    lastError.value = null
    try {
      const { HealthConnect } = await import('capacitor-health-connect')

      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59')

      const result = await HealthConnect.readRecords({
        type: 'Steps',
        timeRangeFilter: {
          type: 'between',
          startTime: start,
          endTime: end,
        },
      })

      if (!result?.records || result.records.length === 0) return null

      // Sum all step records for the day
      const totalSteps = result.records.reduce((sum, record) => {
        return sum + (record.count || 0)
      }, 0)

      return Math.round(totalSteps)
    } catch (e) {
      lastError.value = 'Could not fetch steps from Health Connect'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function importTodayData() {
    const today = new Date().toISOString().split('T')[0]
    const data = {}

    const steps = await getSteps(today)
    if (steps !== null && steps > 0) data.steps = steps

    return data
  }

  return {
    isAvailable,
    isLoading,
    lastError,
    checkAvailability,
    requestPermissions,
    checkPermissions,
    getSteps,
    importTodayData,
  }
}
