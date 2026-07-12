import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('../views/OnboardingView.vue'),
  },
  {
    path: '/tracker',
    name: 'tracker',
    component: () => import('../views/TrackerView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/insights',
    name: 'insights',
    component: () => import('../views/InsightsView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/summary',
    name: 'summary',
    component: () => import('../views/SummaryView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresOnboarding: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  // Import store dynamically to avoid circular deps
  const { useSettingsStore } = await import('../stores/settings')
  const settingsStore = useSettingsStore()

  // Load settings if not loaded
  if (!settingsStore._loaded) {
    await settingsStore.loadSettings()
    settingsStore._loaded = true
  }

  if (to.meta.requiresOnboarding && !settingsStore.settings.onboardingComplete) {
    next({ name: 'onboarding' })
  } else if (to.name === 'onboarding' && settingsStore.settings.onboardingComplete) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
