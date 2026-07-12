import { ref } from 'vue'

const isReady = ref(false)
let dbInstance = null

const DB_NAME = 'loom_db'
const DB_VERSION = 2

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance)
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('metric', 'metric', { unique: false })
        store.createIndex('date_metric', ['date', 'metric'], { unique: true })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    request.onsuccess = (e) => {
      dbInstance = e.target.result
      resolve(dbInstance)
    }
    request.onerror = () => reject(request.error)
  })
}

function tx(storeName, mode = 'readonly') {
  return dbInstance.transaction(storeName, mode).objectStore(storeName)
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Migration: copy localStorage data into IndexedDB on first run
async function migrateFromLocalStorage() {
  const migratedKey = 'loom_migrated_to_idb'
  if (localStorage.getItem(migratedKey)) return

  try {
    const raw = localStorage.getItem('loom_data')
    if (!raw) {
      localStorage.setItem(migratedKey, '1')
      return
    }
    const data = JSON.parse(raw)
    if (data.entries?.length) {
      const store = tx('entries', 'readwrite')
      for (const entry of data.entries) {
        const { id, ...rest } = entry
        store.put(rest)
      }
    }
    if (data.settings?.length) {
      const store = tx('settings', 'readwrite')
      for (const s of data.settings) {
        store.put(s)
      }
    }
    localStorage.setItem(migratedKey, '1')
  } catch {
    // Migration failed silently — fresh start is fine
  }
}

export function useDatabase() {
  async function initDatabase() {
    if (isReady.value) return
    await openDB()
    await migrateFromLocalStorage()
    isReady.value = true
  }

  // SQL-like API preserved for compatibility with existing stores
  async function run(sql, params = []) {
    if (!isReady.value) await initDatabase()
    const trimmed = sql.trim().toUpperCase()

    if (trimmed.includes('INSERT')) {
      if (trimmed.includes('ENTRIES')) {
        const [date, metric, value, note] = params
        // Check for existing entry with same date+metric
        const store = tx('entries', 'readwrite')
        const idx = store.index('date_metric')
        const existing = await idbRequest(idx.get([date, metric]))
        const entry = {
          ...(existing || {}),
          date,
          metric,
          value,
          note: note || null,
          created_at: new Date().toISOString(),
        }
        await idbRequest(store.put(entry))
      } else if (trimmed.includes('SETTINGS')) {
        const [key, value] = params
        const store = tx('settings', 'readwrite')
        await idbRequest(store.put({ key, value }))
      }
    }

    if (trimmed.includes('DELETE')) {
      if (trimmed.includes('ENTRIES') && params.length >= 2) {
        const [date, metric] = params
        const store = tx('entries', 'readwrite')
        const idx = store.index('date_metric')
        const existing = await idbRequest(idx.get([date, metric]))
        if (existing) await idbRequest(store.delete(existing.id))
      }
    }

    return { changes: 1 }
  }

  async function query(sql, params = []) {
    if (!isReady.value) await initDatabase()
    const trimmed = sql.trim().toUpperCase()

    if (trimmed.includes('FROM ENTRIES')) {
      const store = tx('entries', 'readonly')

      // COUNT(*)
      if (trimmed.includes('COUNT(*)')) {
        const date = params[0]
        if (date) {
          const idx = store.index('date')
          const results = await idbRequest(idx.getAll(date))
          return [{ count: results.length }]
        }
        const all = await idbRequest(store.getAll())
        return [{ count: all.length }]
      }

      // WHERE date = ? AND metric = ?
      if (trimmed.includes('DATE') && trimmed.includes('METRIC') && params.length >= 2) {
        const idx = store.index('date_metric')
        const result = await idbRequest(idx.get(params))
        return result ? [result] : []
      }

      // WHERE date = ?
      if (trimmed.includes('WHERE') && trimmed.includes('DATE') && !trimmed.includes('DATE >=') && params[0]) {
        const idx = store.index('date')
        let results = await idbRequest(idx.getAll(params[0]))
        if (trimmed.includes('METRIC') && params[1]) {
          results = results.filter(e => e.metric === params[1])
        }
        return results
      }

      // WHERE date >= ? AND date <= ? (range)
      if (trimmed.includes('DATE >=') && trimmed.includes('DATE <=')) {
        const all = await idbRequest(store.getAll())
        const dateParams = params.filter(p => typeof p === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p))
        let results = all
        if (dateParams.length >= 2) {
          results = all.filter(e => e.date >= dateParams[0] && e.date <= dateParams[1])
        }
        if (trimmed.includes('METRIC') && params.find(p => typeof p === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(p))) {
          const metricParam = params.find(p => typeof p === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(p))
          results = results.filter(e => e.metric === metricParam)
        }
        if (trimmed.includes('ORDER BY DATE ASC')) {
          results.sort((a, b) => a.date.localeCompare(b.date))
        }
        return results
      }

      // Default: get all
      let results = await idbRequest(store.getAll())
      if (trimmed.includes('ORDER BY DATE DESC')) {
        results.sort((a, b) => b.date.localeCompare(a.date))
      } else if (trimmed.includes('ORDER BY DATE ASC')) {
        results.sort((a, b) => a.date.localeCompare(b.date))
      }
      return results
    }

    if (trimmed.includes('FROM SETTINGS')) {
      const store = tx('settings', 'readonly')
      return await idbRequest(store.getAll())
    }

    return []
  }

  async function exportAll() {
    if (!isReady.value) await initDatabase()
    const entries = await idbRequest(tx('entries', 'readonly').getAll())
    const settings = await idbRequest(tx('settings', 'readonly').getAll())
    return { entries, settings }
  }

  async function importData(data) {
    if (!isReady.value) await initDatabase()
    if (data.entries?.length) {
      const store = tx('entries', 'readwrite')
      for (const entry of data.entries) {
        const { id, ...rest } = entry
        await idbRequest(store.put(rest))
      }
    }
    if (data.settings?.length) {
      const store = tx('settings', 'readwrite')
      for (const s of data.settings) {
        await idbRequest(store.put(s))
      }
    }
  }

  async function clearAll() {
    if (!isReady.value) await initDatabase()
    const eStore = tx('entries', 'readwrite')
    await idbRequest(eStore.clear())
    const sStore = tx('settings', 'readwrite')
    await idbRequest(sStore.clear())
  }

  return { isReady, initDatabase, run, query, exportAll, importData, clearAll }
}
