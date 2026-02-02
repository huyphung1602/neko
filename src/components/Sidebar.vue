<template>
  <aside
    class="h-screen bg-[#faf9f7] dark:bg-[#1a1a2e] text-[#1a1a2e] dark:text-white flex flex-col fixed left-0 top-0 z-100 select-none"
    :style="{ width: `${sidebarWidth}px` }"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- Resize handle -->
    <div
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 transition-colors"
      @mousedown="handleMouseDown"
    ></div>

    <!-- Main Navigation -->
    <nav class="p-2 flex flex-col gap-0.5">
      <button @click="navigateTo('/')" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </button>

      <button @click="startQuickReview" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Review</span>
        <span v-if="dueCount > 0" class="ml-auto text-[10px] bg-red-500 text-white font-semibold px-1.5 py-0.5 rounded-full">{{ dueCount }}</span>
      </button>

      <button @click="openCardModal" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Card</span>
      </button>
    </nav>

    <!-- Decks Section -->
    <div class="flex-1 flex flex-col overflow-hidden px-2 py-1 min-h-0">
      <div class="flex items-center justify-between px-2 py-1.5">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Decks</span>
      </div>
      <div class="flex-1 overflow-y-auto flex flex-col">
        <DeckTreeItem
          v-for="item in deckTree"
          :key="item.deck.path"
          :item="item"
          :isSelected="isDeckSelected(item.deck.path)"
        />
        <div v-if="deckStore.allDecks.length === 0" class="px-2 py-2 text-xs text-center text-gray-400">
          No decks
        </div>
      </div>
      <button @click="openCreateDeckModal" class="flex items-center gap-1.5 px-2 py-1.5 mt-1 border-none bg-none w-full text-left cursor-pointer rounded text-xs transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Deck</span>
      </button>
    </div>

    <!-- Bottom Actions -->
    <div class="p-2 border-t border-gray-200 dark:border-gray-700">
      <button @click="changeWorkspace" class="nav-item">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span>Change Workspace</span>
      </button>

      <button @click="toggleDarkMode" class="nav-item">
        <svg v-if="isDark" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>{{ isDark ? 'Light' : 'Dark' }}</span>
      </button>
    </div>

    <!-- Card Modal -->
    <CardModal v-model="showCardModal" @saved="handleCardSaved" />

    <!-- Create Deck Modal -->
    <Teleport to="body">
      <div v-if="showCreateDeckModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showCreateDeckModal = false"></div>
        <div class="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
          <h2 class="text-base font-semibold mb-3 dark:text-white">New Deck</h2>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium mb-1 dark:text-gray-300">Name</label>
              <input
                v-model="newDeckName"
                type="text"
                class="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Deck name"
                @keyup.enter="createDeck"
              />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1 dark:text-gray-300">Parent (optional)</label>
              <select
                v-model="selectedParentPath"
                class="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option :value="undefined">None (root deck)</option>
                <option v-for="deck in sortedDecks" :key="deck.path" :value="deck.path">
                  {{ '  '.repeat(deckDepth(deck.path)) }}{{ deck.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button
              @click="showCreateDeckModal = false"
              class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              @click="createDeck"
              :disabled="!newDeckName.trim()"
              class="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDeckStore } from '@/stores/deck';
import { useCardStore } from '@/stores/card';
import { useReviewStore } from '@/stores/review';
import { useWorkspaceStore } from '@/stores/workspace';
import DeckTreeItem from './DeckTreeItem.vue';
import CardModal from './CardModal.vue';

const router = useRouter();
const deckStore = useDeckStore();
const cardStore = useCardStore();
const reviewStore = useReviewStore();
const workspaceStore = useWorkspaceStore();

const showCardModal = ref(false);
const showCreateDeckModal = ref(false);
const newDeckName = ref('');
const selectedParentPath = ref<string | undefined>(undefined);
const isResizing = ref(false);
const sidebarWidth = ref(240);
const startX = ref(0);
const startWidth = ref(0);

const deckTree = computed(() => deckStore.deckTreeItems);
const isDark = computed(() => document.documentElement.classList.contains('dark'));
const dueCount = computed(() => cardStore.allCards.filter(c => c.nextReviewDate && new Date(c.nextReviewDate) <= new Date()).length);
const sortedDecks = computed(() => {
  return [...deckStore.allDecks].sort((a, b) => a.path.localeCompare(b.path));
});

function deckDepth(path: string): number {
  return (path.match(/\//g) || []).length - 1;
}

function isDeckSelected(path: string): boolean {
  return router.currentRoute.value.path === `/decks/${encodeURIComponent(path.slice(1))}`;
}

function navigateTo(path: string) {
  router.push(path);
}

function openCardModal() {
  showCardModal.value = true;
}

async function handleCardSaved() {
  await cardStore.loadCards();
  await deckStore.loadDecks();
}

async function openCreateDeckModal() {
  selectedParentPath.value = undefined;
  newDeckName.value = '';
  showCreateDeckModal.value = true;
}

async function createDeck() {
  if (!newDeckName.value.trim() || !workspaceStore.workspacePath) return;

  const deck = await deckStore.createDeck(newDeckName.value.trim(), selectedParentPath.value);
  newDeckName.value = '';
  selectedParentPath.value = undefined;
  showCreateDeckModal.value = false;
  // Reload decks without full page refresh
  await deckStore.loadDecks();
  // Navigate to the new deck
  if (deck) {
    const cleanPath = deck.path.startsWith('/') ? deck.path.slice(1) : deck.path;
    router.push(`/decks/${encodeURIComponent(cleanPath)}`);
  }
}

async function startQuickReview() {
  await reviewStore.startReview();
  if (reviewStore.currentCard) {
    router.push('/review');
  }
}

function changeWorkspace() {
  workspaceStore.selectWorkspace();
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? 'true' : 'false');
}

function handleMouseDown(e: MouseEvent) {
  isResizing.value = true;
  startX.value = e.clientX;
  startWidth.value = sidebarWidth.value;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.body.classList.add('resizing');
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing.value) return;
  requestAnimationFrame(() => {
    const diff = e.clientX - startX.value;
    const newWidth = startWidth.value + diff;
    const clampedWidth = Math.max(160, Math.min(800, newWidth));
    sidebarWidth.value = clampedWidth;
    document.documentElement.style.setProperty('--sidebar-width', `${clampedWidth}px`);
  });
}

function handleMouseUp() {
  if (isResizing.value) {
    isResizing.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing');
  }
}
</script>

<style scoped>
.nav-item {
  @apply flex items-center gap-1.5 px-2 py-1.5 border-none bg-none w-full text-left cursor-pointer rounded transition-all duration-150 text-sm text-gray-600 dark:text-gray-300;
}

.nav-item:hover {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white;
}
</style>
