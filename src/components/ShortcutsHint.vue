<template>
  <div class="px-4 py-2 text-xs text-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
    <span class="hidden sm:inline">{{ ctrlOrCmd }}B bold</span>
    <span class="hidden sm:inline mx-2">|</span>
    <span class="hidden sm:inline">{{ ctrlOrCmd }}I italic</span>
    <span class="hidden sm:inline mx-2">|</span>
    <span>{{ ctrlOrCmd }}Enter to save</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const ctrlOrCmd = computed(() => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl';
});
</script>
