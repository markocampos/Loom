export const defaultMetrics = [
  {
    id: 'mood',
    name: 'Mood',
    icon: 'Smile',
    color: '#6366F1',
    unit: '/10',
    min: 1,
    max: 10,
    step: 1,
    description: 'How are you feeling today?',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    icon: 'Moon',
    color: '#3B82F6',
    unit: 'hrs',
    min: 0,
    max: 14,
    step: 0.5,
    description: 'How many hours did you sleep?',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: 'Coffee',
    color: '#F59E0B',
    unit: 'cups',
    min: 0,
    max: 20,
    step: 1,
    description: 'How many cups of coffee?',
  },
  {
    id: 'steps',
    name: 'Steps',
    icon: 'Footprints',
    color: '#10B981',
    unit: 'steps',
    min: 0,
    max: 100000,
    step: 500,
    description: 'How many steps did you take?',
  },
  {
    id: 'screen_time',
    name: 'Screen Time',
    icon: 'Monitor',
    color: '#F43F5E',
    unit: 'hrs',
    min: 0,
    max: 24,
    step: 0.5,
    description: 'How many hours on screens?',
  },
]

export const metricColors = {
  mood: '#6366F1',
  sleep: '#3B82F6',
  coffee: '#F59E0B',
  steps: '#10B981',
  screen_time: '#F43F5E',
}

export const metricNames = {
  mood: 'Mood',
  sleep: 'Sleep',
  coffee: 'Coffee',
  steps: 'Steps',
  screen_time: 'Screen Time',
}

export const customIcons = ['Heart', 'Dumbbell', 'Book', 'Music', 'Salad', 'Brain', 'Zap', 'Clock', 'Droplets', 'Sun']

export const customColors = [
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
  '#84CC16', '#A855F7', '#EF4444', '#0EA5E9', '#F59E0B',
]

export function getAllMetrics(customMetrics = []) {
  const custom = (customMetrics || []).map(cm => ({
    id: cm.id,
    name: cm.name,
    icon: cm.icon || 'Heart',
    color: cm.color || '#8B5CF6',
    unit: cm.unit || '',
    min: cm.min || 0,
    max: cm.max || 100,
    step: cm.step || 1,
    description: cm.description || '',
    isCustom: true,
  }))
  return [...defaultMetrics, ...custom]
}
