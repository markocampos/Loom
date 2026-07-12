<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { metricNames, metricColors } from '../data/defaultMetrics'

use([ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  metricA: { type: String, default: '' },
  metricB: { type: String, default: '' },
})

const option = computed(() => ({
  grid: { left: 45, right: 16, top: 16, bottom: 40 },
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#334155', fontSize: 12, fontWeight: 500 },
    formatter: (params) => {
      const nameA = metricNames[props.metricA] || props.metricA
      const nameB = metricNames[props.metricB] || props.metricB
      return `<div style="font-weight:600;margin-bottom:4px">${nameA}: ${params.value[0]}</div><div>${nameB}: ${params.value[1]}</div>`
    },
    extraCssText: 'border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 10px 14px;',
  },
  xAxis: {
    name: metricNames[props.metricA] || props.metricA,
    nameLocation: 'center',
    nameGap: 25,
    nameTextStyle: { fontSize: 11, color: '#94a3b8', fontWeight: 600 },
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    axisLabel: { fontSize: 10, color: '#cbd5e1' },
    axisLine: { lineStyle: { color: '#f1f5f9' } },
  },
  yAxis: {
    name: metricNames[props.metricB] || props.metricB,
    nameLocation: 'center',
    nameGap: 35,
    nameTextStyle: { fontSize: 11, color: '#94a3b8', fontWeight: 600 },
    splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    axisLabel: { fontSize: 10, color: '#cbd5e1' },
    axisLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [{
    type: 'scatter',
    data: props.data,
    symbolSize: 10,
    itemStyle: {
      color: {
        type: 'radial',
        x: 0.5, y: 0.5, r: 0.5,
        colorStops: [
          { offset: 0, color: (metricColors[props.metricA] || '#6366F1') + 'cc' },
          { offset: 1, color: metricColors[props.metricA] || '#6366F1' },
        ],
      },
      shadowBlur: 6,
      shadowColor: (metricColors[props.metricA] || '#6366F1') + '25',
      shadowOffsetY: 2,
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 12,
        shadowColor: (metricColors[props.metricA] || '#6366F1') + '40',
      },
    },
    markLine: {
      silent: true,
      lineStyle: { type: 'dashed', color: '#cbd5e1', width: 1.5 },
      label: { show: false },
      data: [{ type: 'average' }],
    },
  }],
}))
</script>

<template>
  <VChart :option="option" style="height: 260px" autoresize />
</template>
