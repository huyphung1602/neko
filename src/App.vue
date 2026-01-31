<script setup lang="ts">
import { onMounted } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useDeckStore } from '@/stores/deck';
import { useCardStore } from '@/stores/card';
import Sidebar from '@/components/Sidebar.vue';

const workspaceStore = useWorkspaceStore();
const deckStore = useDeckStore();
const cardStore = useCardStore();

async function loadData() {
  console.log('[App] Loading data...');
  await deckStore.loadDecks();
  await cardStore.loadCards();
  console.log('[App] Loaded', deckStore.allDecks.length, 'decks and', cardStore.allCards.length, 'cards');
}

onMounted(async () => {
  await workspaceStore.init();
  await loadData();
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="sidebar-separator"></div>
    <main class="main-content with-sidebar">
      <router-view />
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
  left: 280px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e5e5e5;
  z-index: 50;
}

.dark .sidebar-separator {
  background: #374151;
}

.main-content {
  min-height: 100vh;
  flex: 1;
  margin-left: 280px;
}

@media (max-width: 768px) {
  .sidebar-separator {
    display: none;
  }
  .main-content {
    margin-left: 0;
  }
}
</style>
