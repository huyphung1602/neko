<script setup lang="ts">
import { onMounted } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useDeckStore } from '@/stores/deck';
import { useCardStore } from '@/stores/card';
import { useGitStore } from '@/stores/git';
import { useMetadataStore } from '@/stores/metadata';
import Sidebar from '@/components/Sidebar.vue';

const workspaceStore = useWorkspaceStore();
const deckStore = useDeckStore();
const cardStore = useCardStore();
const gitStore = useGitStore();
const metadataStore = useMetadataStore();

async function loadData() {
  if (!workspaceStore.workspacePath) return;
  await deckStore.loadDecks();
  await cardStore.loadCards();
  await metadataStore.loadMetadata();
  await gitStore.refreshStatus();
}

onMounted(async () => {
  await workspaceStore.init();
  if (workspaceStore.workspacePath) {
    await loadData();
  }
});
</script>

<template>
  <!-- Loading state -->
  <div v-if="!workspaceStore.isInitialized" class="h-screen flex items-center justify-center bg-neko-bg dark:bg-gray-900">
    <div class="text-center">
      <div class="text-4xl mb-4">🐱</div>
      <h1 class="text-2xl font-bold mb-2 dark:text-white">Neko</h1>
      <p class="text-neko-muted dark:text-gray-400">Loading...</p>
    </div>
  </div>

  <!-- Workspace Selection -->
  <div v-else-if="!workspaceStore.workspacePath" class="h-screen flex items-center justify-center bg-neko-bg dark:bg-gray-900">
    <div class="max-w-md mx-auto p-8">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Select Workspace</h1>
      <p class="text-neko-muted dark:text-gray-400 mb-6">
        Choose a folder to store your flashcards as markdown files.
      </p>
      <button
        @click="workspaceStore.selectWorkspace()"
        class="btn btn-primary"
      >
        Select Folder
      </button>
    </div>
  </div>

  <!-- Main App -->
  <div v-else class="app-layout">
    <Sidebar />
    <div class="sidebar-separator"></div>
    <main class="main-content with-sidebar">
      <router-view @data-changed="loadData" />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  height: 100%;
}

html {
  --sidebar-width: 240px;
}

body.resizing .sidebar-separator,
body.resizing .main-content,
html.resizing-sidebar .sidebar-separator,
html.resizing-sidebar .main-content {
  transition: none !important;
}
</style>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #faf9f7;
  display: flex;
}

.dark .app-layout {
  background: #111827;
}

.sidebar-separator {
  position: fixed;
  left: var(--sidebar-width);
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e5e5e5;
  z-index: 50;
}

.dark .sidebar-separator {
  background: #111827;
}

.main-content {
  min-height: 100vh;
  flex: 1;
  margin-left: var(--sidebar-width);
}
</style>
