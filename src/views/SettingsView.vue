<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace';

const workspaceStore = useWorkspaceStore();
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto dark:bg-gray-900 dark:text-white min-h-screen">
    <h1 class="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

    <!-- Workspace -->
    <div class="card p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
      <h2 class="text-lg font-semibold mb-4 dark:text-white">Storage</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium dark:text-white">Storage Type</div>
            <div class="text-sm text-neko-muted dark:text-gray-400">{{ workspaceStore.storageType }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="card p-6 dark:bg-gray-800 dark:border-gray-700">
      <h2 class="text-lg font-semibold mb-4 dark:text-white">About Neko</h2>
      <div class="space-y-2 text-sm">
        <p class="dark:text-gray-300">
          Neko is a flashcard application inspired by Mochi.cards and Anki.
        </p>
        <p class="text-neko-muted dark:text-gray-400">
          Your cards are stored locally in IndexedDB. GitHub sync coming soon!
        </p>
      </div>
    </div>
  </div>
</template>
