<script setup>
import { RouterView, useRoute } from 'vue-router'
import SideNav from './components/SideNav.vue'
import BottomNav from './components/BottomNav.vue'
import { computed, onMounted } from 'vue'
import { useSettingsStore } from './stores/settings'
import { useNotifications } from './composables/useNotifications'

const route = useRoute()
const settingsStore = useSettingsStore()
const notifications = useNotifications()

const showNav = computed(() => {
  const noNav = ['onboarding']
  return !noNav.includes(route.name)
})

onMounted(async () => {
  await settingsStore.loadSettings()
  
  if (settingsStore.settings.reminderEnabled && notifications.isSupported.value) {
    if (notifications.permission.value === 'granted') {
      const time = settingsStore.settings.reminderTime || '20:00'
      const [h, m] = time.split(':').map(Number)
      notifications.scheduleReminder(h, m, "Time to log your day! Don't break your streak.")
    }
  }

  if (settingsStore.settings.weeklySummaryEnabled && notifications.isSupported.value) {
    if (notifications.permission.value === 'granted') {
      notifications.scheduleWeeklySummary(0, 18, 0, 'Check out your weekly progress!') // Sunday 6 PM
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 md:bg-gray-100">
    <!-- Desktop sidebar -->
    <SideNav v-if="showNav" class="hidden md:flex" />

    <!-- Main content area -->
    <div class="min-h-screen md:ml-[72px]">
      <div class="app-shell bg-background min-h-screen">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>

        <!-- Mobile bottom nav -->
        <BottomNav v-if="showNav" class="md:hidden" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
