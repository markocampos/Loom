<script setup>
import { computed } from 'vue'
import { Coffee, Footprints, Monitor, Minus, Plus } from 'lucide-vue-next'

const iconMap = { Coffee, Footprints, Monitor }

const props = defineProps({
  modelValue: { type: Number, default: null },
  label: { type: String, required: true },
  icon: { type: String, default: 'Coffee' },
  color: { type: String, default: '#F59E0B' },
  unit: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  presets: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const iconComponent = computed(() => iconMap[props.icon] || Coffee)
const displayValue = computed(() => props.modelValue ?? 0)

function increment() {
  const val = Math.min(props.max, Math.round((displayValue.value + props.step) * 10) / 10)
  emit('update:modelValue', val)
}

function decrement() {
  const val = Math.max(props.min, Math.round((displayValue.value - props.step) * 10) / 10)
  emit('update:modelValue', val)
}

function setPreset(val) {
  emit('update:modelValue', val)
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2.5 mb-4">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
        :style="{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, boxShadow: `0 2px 8px ${color}10` }"
      >
        <component :is="iconComponent" :size="18" :style="{ color }" />
      </div>
      <div class="flex-1">
        <span class="font-semibold text-gray-900 text-[15px]">{{ label }}</span>
        <span class="text-[11px] text-gray-400 block">{{ unit }}</span>
      </div>
      <span class="text-xl font-bold tabular-nums" :style="{ color }">{{ displayValue }}</span>
    </div>

    <!-- Stepper -->
    <div class="flex items-center gap-4 mb-4">
      <button
        @click="decrement"
        class="w-12 h-12 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 active:bg-gray-200 active:scale-90 transition-all duration-200"
      >
        <Minus :size="18" />
      </button>
      <div class="flex-1 text-center">
        <input
          type="number"
          :value="displayValue"
          @input="emit('update:modelValue', Number($event.target.value))"
          :min="min"
          :max="max"
          :step="step"
          class="w-full text-center text-3xl font-bold text-gray-900 bg-transparent focus:outline-none tabular-nums"
        />
      </div>
      <button
        @click="increment"
        class="w-12 h-12 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all duration-200 shadow-lg"
        :style="{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, boxShadow: `0 4px 16px ${color}35` }"
      >
        <Plus :size="18" />
      </button>
    </div>

    <!-- Presets -->
    <div v-if="presets.length" class="flex gap-2">
      <button
        v-for="preset in presets"
        :key="preset"
        @click="setPreset(preset)"
        class="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-95"
        :class="displayValue === preset
          ? 'text-white shadow-lg'
          : 'bg-gray-50/80 text-gray-500 hover:bg-gray-100/80'"
        :style="displayValue === preset ? { background: `linear-gradient(135deg, ${color}, ${color}dd)`, boxShadow: `0 4px 16px ${color}30` } : {}"
      >
        {{ preset >= 1000 ? (preset / 1000) + 'k' : preset }}
      </button>
    </div>
  </div>
</template>
