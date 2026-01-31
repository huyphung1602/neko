<script setup lang="ts">
import { useWorkspaceStore } from '@/stores/workspace';
import { useGitStore } from '@/stores/git';
import { computed } from 'vue';

const workspaceStore = useWorkspaceStore();
const gitStore = useGitStore();

const workspacePath = computed(() => workspaceStore.workspacePath || 'Not selected');
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto dark:bg-gray-900 dark:text-white min-h-screen">
    <h1 class="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

    <!-- Workspace -->
    <div class="card p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
      <h2 class="text-lg font-semibold mb-4 dark:text-white">Workspace</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium dark:text-white">Folder Location</div>
            <div class="text-sm text-neko-muted dark:text-gray-400 break-all">{{ workspacePath }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Git Status -->
    <div class="card p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
      <h2 class="text-lg font-semibold mb-4 dark:text-white">Git Integration</h2>
      <div class="space-y-4">
        <div v-if="gitStore.isGitRepo" class="flex items-center justify-between">
          <div>
            <div class="font-medium dark:text-white">Status</div>
            <div class="text-sm text-neko-muted dark:text-gray-400">
              <span v-if="gitStore.pendingChanges > 0">{{ gitStore.pendingChanges }} pending changes</span>
              <span v-else class="text-green-500">All changes committed</span>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-neko-muted dark:text-gray-400">
          Git is not initialized. Enable it from the sidebar to track changes.
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
          Your cards are stored as markdown files in your workspace folder.
        </p>
      </div>
    </div>
  </div>
</template>
