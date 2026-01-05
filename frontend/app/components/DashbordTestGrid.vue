<template>
  <div class="dynamic-dashboard" :style="dashboardVars">
    <DashboardWidget
      v-for="widget in widgets"
      :key="widget.id"
      :widget="widget"
      :style="getWidgetStyle(widget)"
      @resize="handleResize(widget.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">

// Виджеты с их позициями и размерами
const widgets = ref([
  { id: 1, type: 'chart', row: 1, col: 1, width: 2, height: 2, priority: 1 },
  { id: 2, type: 'stats', row: 1, col: 3, width: 1, height: 1, priority: 2 },
  { id: 3, type: 'table', row: 2, col: 1, width: 3, height: 2, priority: 3 },
])

// Настройки dashboard
const cellSize = ref(100) // px
const gap = ref(16)

const dashboardVars = computed(() => ({
  '--dashboard-cols': 12, // Фиксированное количество колонок
  '--dashboard-rows': 'auto',
  '--dashboard-cell-size': `${cellSize.value}px`,
  '--dashboard-gap': `${gap.value}px`,
  '--dashboard-min-row-height': '80px'
}))

const getWidgetStyle = (widget: any) => {
  // Вычисляем grid-area: row-start / col-start / row-end / col-end
  return {
    '--widget-row-start': widget.row,
    '--widget-col-start': widget.col,
    '--widget-row-end': `span ${widget.height}`,
    '--widget-col-end': `span ${widget.width}`,
    '--widget-priority': widget.priority,
    '--widget-z-index': widget.priority,
    '--widget-delay': `${widget.priority * 0.1}s`
  }
}

const handleResize = (widgetId: number, newSize: { width: number, height: number }) => {
  // Обновляем размеры виджета
  const widget = widgets.value.find(w => w.id === widgetId)
  if (widget) {
    widget.width = newSize.width
    widget.height = newSize.height
  }
}
</script>

<style scoped>
.dynamic-dashboard {
  display: grid;
  grid-template-columns: repeat(var(--dashboard-cols, 12), minmax(0, 1fr));
  grid-auto-rows: minmax(var(--dashboard-min-row-height, 80px), auto);
  gap: var(--dashboard-gap, 16px);
  padding: var(--dashboard-gap, 16px);
  
  /* Для сложных dashboard */
  grid-auto-flow: dense;
}

.dashboard-widget {
  grid-area: 
    var(--widget-row-start, auto) 
    var(--widget-col-start, auto) 
    var(--widget-row-end, auto) 
    var(--widget-col-end, auto);
  
  z-index: var(--widget-z-index, 1);
  animation: widgetAppear 0.4s ease var(--widget-delay, 0s) both;
  
  /* Resizable */
  resize: both;
  overflow: auto;
  min-width: calc(var(--dashboard-cell-size, 100px) * 2);
  min-height: calc(var(--dashboard-cell-size, 100px));
}

@keyframes widgetAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

</style>