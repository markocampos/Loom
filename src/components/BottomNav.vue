<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, TrendingUp, BarChart3, History, Settings } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'Home', icon: Home, route: '/' },
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
  <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 safe-bottom z-50">
    <div class="flex justify-around items-center h-[68px] max-w-lg mx-auto px-2">
      <button
        v-for="tab in tabs"
        :key="tab.route"
        @click="navigate(tab.route)"
        class="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[64px] relative"
        :class="currentRoute === tab.route ? 'text-primary' : 'text-gray-400'"
      >
        <!-- Active pill bg -->
        <div
          v-if="currentRoute === tab.route"
          class="absolute inset-x-1 -top-0.5 h-[3px] bg-primary rounded-full"
        />
        <component
          :is="tab.icon"
          :size="22"
          :stroke-width="currentRoute === tab.route ? 2.2 : 1.5"
          class="transition-all duration-200"
          :class="currentRoute === tab.route ? 'scale-110' : ''"
        />
        <span class="text-[10px] font-medium transition-colors">{{ tab.name }}</span>
      </button>
    </div>
  </nav>
</template>
