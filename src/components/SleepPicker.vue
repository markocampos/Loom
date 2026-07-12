<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue'])

const bedtime = ref('23:00')
const waketime = ref('07:00')

const sleepHours = computed(() => {
  const [bh, bm] = bedtime.value.split(':').map(Number)
  const [wh, wm] = waketime.value.split(':').map(Number)

  let bedMinutes = bh * 60 + bm
  let wakeMinutes = wh * 60 + wm

  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60
  }

  const diff = wakeMinutes - bedMinutes
  return Math.round((diff / 60) * 10) / 10
})

watch(sleepHours, (val) => {
  emit('update:modelValue', val)
}, { immediate: true })

const quality = computed(() => {
  const h = sleepHours.value
  if (h >= 8) return { text: 'Excellent', color: 'text-success', bg: 'bg-success/10', icon: '🌟' }
  if (h >= 7) return { text: 'Good', color: 'text-primary', bg: 'bg-primary/10', icon: '😊' }
  if (h >= 6) return { text: 'Fair', color: 'text-amber-500', bg: 'bg-amber-50', icon: '😐' }
  return { text: 'Low', color: 'text-warning', bg: 'bg-warning/10', icon: '😴' }
})
</script>

<template>
  <div>
    <div class="flex items-center gap-2.5 mb-4">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm shadow-blue-100/50">
        <span class="text-lg">🌙</span>
      </div>
      <div class="flex-1">
        <span class="font-semibold text-gray-900 text-[15px]">Sleep</span>
        <span class="text-[11px] text-gray-400 block">Bedtime → Wake up</span>
      </div>
      <Transition name="pop" mode="out-in">
        <div :key="sleepHours" class="flex items-center gap-2">
          <span class="text-xl font-bold tabular-nums text-gray-900">{{ sleepHours }}h</span>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full" :class="[quality.color, quality.bg]">
            {{ quality.text }}
          </span>
        </div>
      </Transition>
    </div>

    <div class="flex items-center gap-3">
      <div class="flex-1">
        <label class="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-2 block">Bedtime</label>
        <input
          v-model="bedtime"
          type="time"
          class="w-full px-3.5 py-3 rounded-xl border border-gray-200/80 text-sm font-semibold text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
        />
      </div>
      <div class="flex items-end pb-3.5">
        <div class="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gray-300">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <label class="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-2 block">Wake up</label>
        <input
          v-model="waketime"
          type="time"
          class="w-full px-3.5 py-3 rounded-xl border border-gray-200/80 text-sm font-semibold text-gray-900 bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pop-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.9); }
.pop-leave-to { opacity: 0; transform: scale(0.9); }
</style>
