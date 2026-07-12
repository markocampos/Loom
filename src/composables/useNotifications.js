import { ref } from 'vue'

const permission = ref('default')
const isSupported = ref(false)

export function useNotifications() {
  // Check if notifications are supported
  if (typeof window !== 'undefined' && 'Notification' in window) {
    isSupported.value = true
    permission.value = Notification.permission
  }

  async function requestPermission() {
    if (!isSupported.value) return false
    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  function showNotification(title, body, options = {}) {
    if (!isSupported.value || permission.value !== 'granted') return null

    const notification = new Notification(title, {
      body,
      icon: options.icon || '/loom.png',
      badge: options.badge || '/loom.png',
      tag: options.tag || 'loom-reminder',
      renotify: options.renotify !== false,
      ...options,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      if (options.onClick) options.onClick()
    }

    return notification
  }

  function scheduleReminder(hour, minute, message) {
    const now = new Date()
    const target = new Date()
    target.setHours(hour, minute, 0, 0)

    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    const delay = target.getTime() - now.getTime()

    return setTimeout(() => {
      showNotification('Loom', message || "Time to log your day! Don't break your streak.", {
        tag: 'loom-daily-reminder',
        renotify: true,
      })
    }, delay)
  }

  function scheduleWeeklySummary(dayOfWeek, hour, minute, summary) {
    const now = new Date()
    const target = new Date()
    target.setDate(now.getDate() + ((dayOfWeek - now.getDay() + 7) % 7 || 7))
    target.setHours(hour, minute, 0, 0)

    const delay = target.getTime() - now.getTime()

    return setTimeout(() => {
      showNotification('Loom Weekly Summary', summary || 'Check out your weekly progress!', {
        tag: 'loom-weekly-summary',
        renotify: true,
      })
    }, delay)
  }

  function cancelAllReminders() {
    // Note: setTimeout IDs are not tracked here in this simple implementation
    // A production app would use Service Workers or Capacitor Local Notifications
  }

  // Quick reminder presets
  const reminderPresets = [
    { label: 'Morning (8 AM)', hour: 8, minute: 0 },
    { label: 'Lunch (12 PM)', hour: 12, minute: 0 },
    { label: 'Evening (6 PM)', hour: 18, minute: 0 },
    { label: 'Night (9 PM)', hour: 21, minute: 0 },
  ]

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleReminder,
    scheduleWeeklySummary,
    cancelAllReminders,
    reminderPresets,
  }
}
