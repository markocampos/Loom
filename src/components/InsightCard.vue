<script setup>
import { Sparkles } from '@lucide/vue'

defineProps({
  text: { type: String, required: true },
})
</script>

<template>
  <div class="group relative bg-gradient-to-br from-primary/[0.04] via-indigo-50/50 to-purple-50/30 rounded-2xl p-4 border border-primary/10 overflow-hidden card-hover">
    <!-- Subtle pattern overlay -->
    <div class="absolute inset-0 opacity-[0.02] pointer-events-none"
      style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 20px 20px;"
    />

    <div class="relative flex items-start gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 shadow-sm shadow-primary/10 group-hover:scale-110 transition-transform">
        <Sparkles :size="16" class="text-primary" />
      </div>
      <p class="text-[13px] text-gray-700 font-medium leading-relaxed pt-1">{{ text }}</p>
    </div>
  </div>
</template>
