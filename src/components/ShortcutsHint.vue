<template>
  <div class="px-4 py-2 text-xs text-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <div class="flex items-center gap-1.5">
        <kbd class="shortcut-key">{{ ctrlOrCmd }}</kbd>
        <kbd class="shortcut-key">B</kbd>
        <span class="hidden sm:inline text-gray-400 dark:text-gray-500">Bold</span>
      </div>
      <span class="text-gray-200 dark:text-gray-700">|</span>
      <div class="flex items-center gap-1.5">
        <kbd class="shortcut-key">{{ ctrlOrCmd }}</kbd>
        <kbd class="shortcut-key">I</kbd>
        <span class="hidden sm:inline text-gray-400 dark:text-gray-500">Italic</span>
      </div>
      <span class="text-gray-200 dark:text-gray-700">|</span>
      <div class="flex items-center gap-1.5">
        <kbd class="shortcut-key">{{ ctrlOrCmd }}</kbd>
        <kbd class="shortcut-key">Shift</kbd>
        <kbd class="shortcut-key">-</kbd>
        <span class="hidden sm:inline text-gray-400 dark:text-gray-500">Divider</span>
      </div>
      <span class="text-gray-200 dark:text-gray-700">|</span>
      <div class="flex items-center gap-1.5">
        <kbd class="shortcut-key">{{ ctrlOrCmd }}</kbd>
        <kbd class="shortcut-key">Enter</kbd>
        <span class="hidden sm:inline text-gray-400 dark:text-gray-500">Save</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const ctrlOrCmd = computed(() => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl';
});
</script>

<style scoped>
.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .shortcut-key {
  background: #1f2937;
  border-color: #4b5563;
  color: #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
