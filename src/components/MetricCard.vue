<script setup>
import { computed } from 'vue'
import { Smile, Moon, Coffee, Footprints, Monitor } from 'lucide-vue-next'
import { formatMetricValue } from '../utils/formatters'

const iconMap = { Smile, Moon, Coffee, Footprints, Monitor }

const props = defineProps({
  metricId: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  value: { type: Number, default: null },
  unit: { type: String, default: '' },
  index: { type: Number, default: 0 },
})

const iconComponent = computed(() => iconMap[props.icon] || Smile)

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) return '--'
  return formatMetricValue(props.metricId, props.value)
})

const hasValue = computed(() => props.value !== null && props.value !== undefined)
</script>

<template>
  <div
    class="group relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 flex flex-col items-center gap-2.5 min-h-[110px] transition-all duration-300 card-hover animate-scale-in"
    :class="[
      hasValue ? 'ring-1 ring-opacity-20' : '',
      `stagger-${index + 1}`
    ]"
    :style="hasValue ? { '--tw-ring-color': color + '25' } : {}"
  >
    <!-- Icon with gradient bg -->
    <div
      class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
      :style="{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }"
    >
      <component :is="iconComponent" :size="20" :style="{ color }" />
    </div>

    <!-- Value -->
    <div class="text-center">
      <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ name }}</div>
      <div
        class="text-xl font-bold mt-0.5 tabular-nums transition-colors duration-300"
        :style="{ color: hasValue ? color : '#e2e8f0' }"
      >
        {{ formattedValue }}
      </div>
    </div>

    <!-- Subtle gradient glow -->
    <div
      v-if="hasValue"
      class="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
      :style="{
        background: `radial-gradient(circle at 50% 30%, ${color}08, transparent 70%)`,
        opacity: 1,
      }"
    />
  </div>
</template>
