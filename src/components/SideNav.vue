<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, TrendingUp, BarChart3, History, Settings, Plus } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'Dashboard', icon: Home, route: '/' },
  { name: 'Insights', icon: TrendingUp, route: '/insights' },
  { name: 'Summary', icon: BarChart3, route: '/summary' },
  { name: 'History', icon: History, route: '/history' },
  { name: 'Settings', icon: Settings, route: '/settings' },
]

const currentRoute = computed(() => route.path)

function navigate(path) {
  router.push(path)
}
</script>

<template>
  <nav class="fixed left-0 top-0 bottom-0 w-[72px] bg-white border-r border-gray-200 z-50 flex flex-col items-center py-5 gap-1">
    <!-- Logo -->
    <div class="mb-6 overflow-hidden">
      <img src="/loom.png" alt="Loom" class="w-14 h-14 object-contain" />
    </div>

    <!-- Nav Items -->
    <div class="flex flex-col gap-1 flex-1">
      <button
        v-for="tab in tabs"
        :key="tab.route"
        @click="navigate(tab.route)"
        class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative group"
        :class="currentRoute === tab.route
          ? 'bg-primary/10 text-primary'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'"
      >
        <component :is="tab.icon" :size="22" :stroke-width="currentRoute === tab.route ? 2.2 : 1.5" />
        <!-- Active indicator -->
        <div
          v-if="currentRoute === tab.route"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
        />
        <!-- Tooltip -->
        <div class="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {{ tab.name }}
        </div>
      </button>
    </div>

    <!-- Quick Add -->
    <button
      @click="navigate('/tracker')"
      class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
    >
      <Plus :size="22" />
    </button>
  </nav>
</template>
