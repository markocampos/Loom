import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDatabase } from '../composables/useDatabase'
import { getToday } from '../utils/formatters'

export const useMetricsStore = defineStore('metrics', () => {
  const { run, query, isReady, initDatabase, exportAll, importData } = useDatabase()

  const entries = ref([])
  const loading = ref(false)

  async function loadEntries(date = null) {
    if (!isReady.value) await initDatabase()
    loading.value = true
    try {
      if (date) {
        const rows = await query('SELECT * FROM entries WHERE date = ?', [date])
        entries.value = rows
      } else {
        const rows = await query('SELECT * FROM entries ORDER BY date DESC')
        entries.value = rows
      }
    } finally {
      loading.value = false
    }
  }

  async function loadEntriesRange(startDate, endDate) {
    if (!isReady.value) await initDatabase()
    loading.value = true
    try {
      const rows = await query(
        'SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
        [startDate, endDate]
      )
      entries.value = rows
    } finally {
      loading.value = false
    }
  }

  async function saveEntry(date, metric, value, note = null) {
    if (!isReady.value) await initDatabase()
    await run(
      'INSERT OR REPLACE INTO entries (date, metric, value, note) VALUES (?, ?, ?, ?)',
      [date, metric, value, note]
    )
    // Reload current view
    await loadEntries()
  }

  async function saveDay(date, dayData) {
    if (!isReady.value) await initDatabase()
    for (const [metric, value] of Object.entries(dayData)) {
      if (value !== null && value !== undefined && value !== '' && metric !== 'daily_note') {
        await run(
          'INSERT OR REPLACE INTO entries (date, metric, value) VALUES (?, ?, ?)',
          [date, metric, Number(value)]
        )
      }
    }
    await loadEntries()
  }

  async function getEntryForDate(date, metric) {
    if (!isReady.value) await initDatabase()
    const rows = await query(
      'SELECT * FROM entries WHERE date = ? AND metric = ?',
      [date, metric]
    )
    return rows[0] || null
  }

  async function getEntriesForDate(date) {
    if (!isReady.value) await initDatabase()
    return await query('SELECT * FROM entries WHERE date = ?', [date])
  }

  async function getEntriesForMetric(metric) {
    if (!isReady.value) await initDatabase()
    return await query(
      'SELECT * FROM entries WHERE metric = ? ORDER BY date ASC',
      [metric]
    )
  }

  async function getEntriesForMetricRange(metric, startDate, endDate) {
    if (!isReady.value) await initDatabase()
    return await query(
      'SELECT * FROM entries WHERE metric = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [metric, startDate, endDate]
    )
  }

  async function getAllEntries() {
    if (!isReady.value) await initDatabase()
    return await query('SELECT * FROM entries ORDER BY date ASC')
  }

  async function getStreak() {
    if (!isReady.value) await initDatabase()
    const today = getToday()
    let streak = 0
    let date = today

    while (true) {
      const rows = await query('SELECT COUNT(*) as count FROM entries WHERE date = ? AND metric != ?', [date, 'daily_note'])
      if (rows[0]?.count >= 1) {
        streak++
        const d = new Date(date)
        d.setDate(d.getDate() - 1)
        date = d.toISOString().split('T')[0]
      } else {
        break
      }
    }
    return streak
  }

  async function deleteEntry(date, metric) {
    if (!isReady.value) await initDatabase()
    await run('DELETE FROM entries WHERE date = ? AND metric = ?', [date, metric])
    await loadEntries()
  }

  async function exportData() {
    if (!isReady.value) await initDatabase()
    return await exportAll()
  }

  async function importDataPayload(data) {
    if (!isReady.value) await initDatabase()
    await importData(data)
    await loadEntries()
  }

  return {
    entries,
    loading,
    loadEntries,
    loadEntriesRange,
    saveEntry,
    saveDay,
    getEntryForDate,
    getEntriesForDate,
    getEntriesForMetric,
    getEntriesForMetricRange,
    getAllEntries,
    getStreak,
    deleteEntry,
    exportData,
    importDataPayload,
  }
})
