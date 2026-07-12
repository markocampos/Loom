<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight, ArrowLeft, Check, Smile, Moon, Coffee,
  Footprints, Monitor, Sparkles, Target, PartyPopper
} from '@lucide/vue'
import { useSettingsStore } from '../stores/settings'
import { defaultMetrics } from '../data/defaultMetrics'

const router = useRouter()
const settingsStore = useSettingsStore()

const step = ref(0)
const enabledMetrics = ref(defaultMetrics.map(m => m.id))
const targets = ref({
  mood: 7,
  sleep: 8,
  coffee: 2,
  steps: 10000,
  screen_time: 4,
})
const direction = ref('forward')
const animating = ref(false)

const iconMap = {
  Smile, Moon, Coffee, Footprints, Monitor,
}

const totalSteps = 3

const enabledMetricObjects = computed(() =>
  defaultMetrics.filter(m => enabledMetrics.value.includes(m.id))
)

onMounted(async () => {
  await settingsStore.loadSettings()
})

function toggleMetric(id) {
  const idx = enabledMetrics.value.indexOf(id)
  if (idx > -1) {
    if (enabledMetrics.value.length <= 1) return
    enabledMetrics.value.splice(idx, 1)
  } else {
    enabledMetrics.value.push(id)
  }
}

function goNext() {
  if (animating.value) return
  if (step.value === 1 && enabledMetrics.value.length === 0) return
  direction.value = 'forward'
  animating.value = true
  setTimeout(() => {
    step.value++
    animating.value = false
  }, 50)
}

function goBack() {
  if (animating.value) return
  direction.value = 'backward'
  animating.value = true
  setTimeout(() => {
    step.value--
    animating.value = false
  }, 50)
}

async function finish() {
  await settingsStore.setEnabledMetrics(enabledMetrics.value)
  await settingsStore.setTargets(targets.value)
  await settingsStore.completeOnboarding()
  router.replace('/')
}

function formatTargetValue(metricId, value) {
  if (metricId === 'steps') return value.toLocaleString()
  if (metricId === 'mood') return `${value}/10`
  return value
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col overflow-hidden">
    <!-- Progress -->
    <div class="px-6 pt-12 safe-top animate-fade-in">
      <div class="flex gap-1.5">
        <div
          v-for="(_, i) in totalSteps + 1"
          :key="i"
          class="h-1 rounded-full flex-1 transition-all duration-500 ease-out"
          :class="i <= step ? 'bg-gradient-to-r from-primary to-primary-dark' : 'bg-gray-200/80'"
        />
      </div>
      <div class="flex justify-between items-center mt-3">
        <button
          v-if="step > 0 && step < totalSteps"
          @click="goBack"
          class="flex items-center gap-1.5 text-sm text-gray-400 font-medium -ml-1 py-1.5 px-2 -mx-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft :size="16" />
          Back
        </button>
        <div v-else />
        <span class="text-[11px] text-gray-300 font-bold tracking-wide">{{ step + 1 }}/{{ totalSteps + 1 }}</span>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col justify-center px-6 py-6 relative">
      <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
        <!-- Step 0: Welcome -->
        <div v-if="step === 0" key="0" class="text-center">
          <div class="relative mb-8">
            <div class="mx-auto relative">
              <!-- Main logo -->
              <img src="/loom.png" alt="Loom" class="w-44 h-44 mx-auto object-contain" />
            </div>
          </div>

          <h1 class="text-[32px] font-bold text-gray-900 mb-2 tracking-tight animate-fade-in stagger-1">Welcome to Loom</h1>
          <p class="text-[15px] text-primary font-semibold mb-1 animate-fade-in stagger-2">Weave your data into insight</p>
          <p class="text-[13px] text-gray-400 max-w-[280px] mx-auto leading-relaxed animate-fade-in stagger-3">
            Track your daily habits and discover hidden patterns that shape your wellbeing.
          </p>
        </div>

        <!-- Step 1: Choose Metrics -->
        <div v-else-if="step === 1" key="1">
          <div class="text-center mb-6">
            <div class="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-primary/10 animate-scale-in">
              <Sparkles :size="24" class="text-primary" />
            </div>
            <h1 class="text-[26px] font-bold text-gray-900 mb-1 animate-fade-in stagger-1">Choose Your Metrics</h1>
            <p class="text-[13px] text-gray-400 animate-fade-in stagger-2">Select what you want to track daily</p>
          </div>

          <div class="space-y-2.5">
            <button
              v-for="(metric, i) in defaultMetrics"
              :key="metric.id"
              @click="toggleMetric(metric.id)"
              class="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all duration-300 active:scale-[0.98] animate-slide-up"
              :class="[
                enabledMetrics.includes(metric.id)
                  ? 'border-current bg-white shadow-md'
                  : 'border-gray-100/80 bg-white/60',
                `stagger-${i + 1}`
              ]"
              :style="enabledMetrics.includes(metric.id) ? { borderColor: metric.color + '35', boxShadow: `0 4px 20px -4px ${metric.color}15` } : {}"
            >
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                :class="enabledMetrics.includes(metric.id) ? 'scale-100' : 'scale-90'"
                :style="{ background: enabledMetrics.includes(metric.id) ? `linear-gradient(135deg, ${metric.color}20, ${metric.color}08)` : '#f8fafc' }"
              >
                <component
                  :is="iconMap[metric.icon]"
                  :size="20"
                  :style="{ color: enabledMetrics.includes(metric.id) ? metric.color : '#94a3b8' }"
                />
              </div>
              <div class="text-left flex-1 min-w-0">
                <div class="font-semibold text-gray-900 text-[15px]">{{ metric.name }}</div>
                <div class="text-[11px] text-gray-400 truncate">{{ metric.description }}</div>
              </div>
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                :class="enabledMetrics.includes(metric.id)
                  ? 'scale-100 opacity-100'
                  : 'scale-50 opacity-0'"
                :style="{ background: enabledMetrics.includes(metric.id) ? `linear-gradient(135deg, ${metric.color}, ${metric.color}dd)` : 'transparent' }"
              >
                <Check :size="14" class="text-white" stroke-width="3" />
              </div>
            </button>
          </div>

          <p class="text-center text-[11px] text-gray-300 mt-4 font-medium">
            {{ enabledMetrics.length }} of {{ defaultMetrics.length }} selected
          </p>
        </div>

        <!-- Step 2: Set Targets -->
        <div v-else-if="step === 2" key="2">
          <div class="text-center mb-6">
            <div class="w-14 h-14 bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-accent/10 animate-scale-in">
              <Target :size="24" class="text-accent" />
            </div>
            <h1 class="text-[26px] font-bold text-gray-900 mb-1 animate-fade-in stagger-1">Set Daily Targets</h1>
            <p class="text-[13px] text-gray-400 animate-fade-in stagger-2">Optional goals to work towards</p>
          </div>

          <div class="space-y-2.5">
            <div
              v-for="(metric, i) in enabledMetricObjects"
              :key="metric.id"
              class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 animate-slide-up"
              :class="`stagger-${i + 1}`"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center"
                    :style="{ background: `linear-gradient(135deg, ${metric.color}18, ${metric.color}08)` }"
                  >
                    <component :is="iconMap[metric.icon]" :size="18" :style="{ color: metric.color }" />
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900 text-[15px]">{{ metric.name }}</div>
                    <div class="text-[11px] text-gray-400">Daily target</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="targets[metric.id] = Math.max(metric.min, targets[metric.id] - metric.step)"
                    class="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center text-gray-500 active:bg-gray-200 active:scale-95 transition-all"
                  >
                    <span class="text-lg font-medium leading-none">−</span>
                  </button>
                  <div class="w-16 text-center">
                    <input
                      type="number"
                      v-model.number="targets[metric.id]"
                      :min="metric.min"
                      :max="metric.max"
                      :step="metric.step"
                      class="w-full text-center text-xl font-bold text-gray-900 bg-transparent focus:outline-none tabular-nums"
                    />
                    <div class="text-[10px] text-gray-300 font-medium -mt-1">{{ metric.unit }}</div>
                  </div>
                  <button
                    @click="targets[metric.id] = Math.min(metric.max, targets[metric.id] + metric.step)"
                    class="w-9 h-9 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
                    :style="{ background: `linear-gradient(135deg, ${metric.color}, ${metric.color}dd)`, boxShadow: `0 4px 12px ${metric.color}30` }"
                  >
                    <span class="text-lg font-medium leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: All Set -->
        <div v-else key="3" class="text-center">
          <div class="relative mb-8">
            <div class="w-28 h-28 mx-auto relative">
              <div class="absolute inset-0 bg-success/5 rounded-[28px]" />
              <div class="relative w-28 h-28 bg-gradient-to-br from-success via-success to-emerald-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-success/30 animate-scale-in">
                <PartyPopper :size="44" class="text-white" />
              </div>
            </div>
          </div>

          <h1 class="text-[32px] font-bold text-gray-900 mb-2 animate-fade-in stagger-1">You're All Set!</h1>
          <p class="text-[13px] text-gray-400 mb-6 animate-fade-in stagger-2">Your journey to better habits starts now</p>

          <!-- Summary Card -->
          <div class="bg-white rounded-2xl p-5 shadow-md border border-gray-100/80 text-left max-w-sm mx-auto animate-slide-up stagger-3 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-bl-full pointer-events-none" />
            <h3 class="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">Your Setup</h3>
            <div class="space-y-2.5">
              <div
                v-for="(metric, i) in enabledMetricObjects"
                :key="metric.id"
                class="flex items-center justify-between py-1"
              >
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-2 h-2 rounded-full"
                    :style="{ backgroundColor: metric.color }"
                  />
                  <span class="text-[13px] text-gray-600 font-medium">{{ metric.name }}</span>
                </div>
                <span class="text-[13px] font-bold text-gray-900 tabular-nums">
                  {{ targets[metric.id] ? formatTargetValue(metric.id, targets[metric.id]) : '—' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Bottom Actions -->
    <div class="px-6 pb-8 safe-bottom">
      <button
        v-if="step < totalSteps"
        @click="goNext"
        :disabled="(step === 1 && enabledMetrics.length === 0) || animating"
        class="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:scale-100"
        :class="(step === 1 && enabledMetrics.length === 0) || animating
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-primary to-primary-dark shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30'"
      >
        {{ step === 0 ? "Let's Begin" : step === 2 ? 'Almost Done' : 'Continue' }}
        <ArrowRight :size="18" />
      </button>
      <button
        v-else
        @click="finish"
        :disabled="animating"
        class="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-success to-emerald-600 shadow-xl shadow-success/25 hover:shadow-2xl hover:shadow-success/30 transition-all duration-300 active:scale-[0.98]"
      >
        Start Tracking
        <ArrowRight :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.98);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-50px) scale(0.98);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.98);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.98);
}

/* Floating animations */
@keyframes float-1 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-14px) scale(1.3); opacity: 1; }
}
@keyframes float-2 {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { transform: translateY(-10px) scale(1.15); opacity: 0.9; }
}
@keyframes float-3 {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-18px); opacity: 0.8; }
}

.animate-float-1 { animation: float-1 3s ease-in-out infinite; }
.animate-float-2 { animation: float-2 4s ease-in-out infinite 0.5s; }
.animate-float-3 { animation: float-3 3.5s ease-in-out infinite 1s; }

@keyframes pulse-slow {
  0%, 100% { opacity: 0.05; transform: scale(1); }
  50% { opacity: 0.12; transform: scale(1.08); }
}
@keyframes pulse-slower {
  0%, 100% { opacity: 0.03; transform: scale(1); }
  50% { opacity: 0.08; transform: scale(1.12); }
}

.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
.animate-pulse-slower { animation: pulse-slower 4s ease-in-out infinite 0.5s; }
</style>
