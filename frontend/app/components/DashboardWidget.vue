
<template>
  <div class="dashboard-widget">
    <div v-if="widget.type === 'chart'" class="widget-content chart-widget">
      <h3>Chart Widget</h3>
      <p>Chart content would go here</p>
    </div>
    <div v-else-if="widget.type === 'stats'" class="widget-content stats-widget">
      <h3>Stats Widget</h3>
      <p>Statistics content would go here</p>
    </div>
    <div v-else-if="widget.type === 'table'" class="widget-content table-widget">
      <h3>Table Widget</h3>
      <p>Table content would go here</p>
    </div>
    <div v-else class="widget-content default-widget">
      <h3>Default Widget</h3>
      <p>Widget type: {{ widget.type }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Widget {
  id: number;
  type: string;
  row: number;
  col: number;
  width: number;
  height: number;
  priority: number;
}

defineProps<{
  widget: Widget;
}>();
</script>

<style scoped>
.dashboard-widget {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
