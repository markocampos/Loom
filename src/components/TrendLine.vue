<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Object, default: () => ({ dates: [], values: [], movingAvg: [] }) },
  color: { type: String, default: '#6366F1' },
})

const option = computed(() => ({
  grid: { left: 8, right: 8, top: 8, bottom: 24 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#334155', fontSize: 11, fontWeight: 500 },
    formatter: (params) => {
      const date = params[0]?.axisValue || ''
      const val = params[0]?.value ?? '--'
      return `<div style="font-weight:600">${date}</div><div style="color:${props.color}">${val}</div>`
    },
    extraCssText: 'border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 8px 12px;',
  },
  xAxis: {
    type: 'category',
    data: props.data.dates.map(d => {
      const date = new Date(d)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    axisLabel: { fontSize: 9, color: '#cbd5e1', interval: Math.max(0, Math.floor(props.data.dates.length / 5) - 1) },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      type: 'line',
      data: props.data.values,
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: props.color, width: 2.5, cap: 'round' },
      itemStyle: { color: props.color, borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: props.color + '20' },
            { offset: 1, color: props.color + '02' },
          ],
        },
      },
    },
    {
      type: 'line',
      data: props.data.movingAvg,
      smooth: 0.4,
      symbol: 'none',
      lineStyle: { color: props.color, width: 1.5, type: 'dashed', opacity: 0.35 },
    },
  ],
}))
</script>

<template>
  <VChart :option="option" style="height: 120px" autoresize />
</template>
