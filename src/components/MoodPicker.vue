<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
})

const emit = defineEmits(['update:modelValue'])

const moods = [
  { value: 1, emoji: '😔', label: 'Terrible', gradient: 'from-red-400 to-rose-500' },
  { value: 2, emoji: '😕', label: 'Bad', gradient: 'from-orange-400 to-amber-500' },
  { value: 3, emoji: '😐', label: 'Okay', gradient: 'from-yellow-400 to-amber-400' },
  { value: 4, emoji: '🙂', label: 'Good', gradient: 'from-lime-400 to-green-400' },
  { value: 5, emoji: '😊', label: 'Nice', gradient: 'from-emerald-400 to-teal-400' },
  { value: 6, emoji: '😄', label: 'Great', gradient: 'from-cyan-400 to-blue-400' },
  { value: 7, emoji: '🤩', label: 'Awesome', gradient: 'from-blue-400 to-indigo-400' },
  { value: 8, emoji: '🥳', label: 'Amazing', gradient: 'from-violet-400 to-purple-400' },
  { value: 9, emoji: '✨', label: 'Perfect', gradient: 'from-fuchsia-400 to-pink-400' },
  { value: 10, emoji: '🌟', label: 'Bliss', gradient: 'from-amber-400 to-yellow-300' },
]

const selected = computed(() => moods.find(m => m.value === props.modelValue))

function select(val) {
  emit('update:modelValue', val)
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2.5 mb-4">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm shadow-primary/10">
        <span class="text-lg">😊</span>
      </div>
      <div class="flex-1">
        <span class="font-semibold text-gray-900 text-[15px]">Mood</span>
        <span class="text-[11px] text-gray-400 block">How are you feeling?</span>
      </div>
      <Transition name="pop" mode="out-in">
        <span v-if="selected" :key="selected.label" class="text-[11px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
          {{ selected.label }}
        </span>
      </Transition>
    </div>

    <div class="grid grid-cols-5 gap-2">
      <button
        v-for="mood in moods"
        :key="mood.value"
        @click="select(mood.value)"
        class="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 active:scale-90 relative overflow-hidden"
        :class="modelValue === mood.value
          ? 'bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/15 scale-105'
          : 'bg-gray-50/80 hover:bg-gray-100/80'"
      >
        <span class="text-[22px] leading-none transition-transform duration-300 relative z-10"
          :class="modelValue === mood.value ? 'scale-125' : ''"
        >
          {{ mood.emoji }}
        </span>
        <span
          class="text-[9px] font-bold relative z-10 transition-colors"
          :class="modelValue === mood.value ? 'text-primary' : 'text-gray-300'"
        >
          {{ mood.value }}
        </span>
        <!-- Selected glow -->
        <div
          v-if="modelValue === mood.value"
          class="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pop-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-leave-active { transition: all 0.15s ease; }
.pop-enter-from { opacity: 0; transform: scale(0.8) translateY(4px); }
.pop-leave-to { opacity: 0; transform: scale(0.8) translateY(-4px); }
</style>
